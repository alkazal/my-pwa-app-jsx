import { supabase } from "./supabase";
import { db } from "../db";

// UI status listener
export let onStatusChange = () => {};
export function setSyncStatusListener(fn) {
  onStatusChange = fn;
}

export async function syncReports() {
  onStatusChange("syncing");

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      onStatusChange("nosession");
      return;
    }

    // Get all unsynced reports
    const unsynced = await db.reports.filter(r => !r.synced).toArray();

    if (unsynced.length === 0) {
      onStatusChange("done");
      return;
    }

    for (const report of unsynced) {
      try {
        let attachmentUrl = report.attachment_url || null;

        // Upload attachment if exists
        if (report.attachment && !report.attachment_url) {
          const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(filename, report.attachment);

          if (uploadError) {
            console.error("Upload failed for report", report.id, uploadError);
            continue;
          }

          const { data: publicData } = supabase.storage
            .from("attachments")
            .getPublicUrl(filename);

          attachmentUrl = publicData?.publicUrl || null;
        }

        // Insert into Supabase
        const { data, error: insertError } = await supabase.from("reports").insert({
          report_type: report.report_type,
          description: report.description,
          attachment_url: attachmentUrl,
          user_id: user.id,
          created_at: report.created_at
        }).select().single();

        if (insertError) {
          console.error("Insert failed for report", report.id, insertError);
          continue;
        }

        // Mark Dexie row as synced
        await db.reports.update(report.id, {
          synced: true,
          attachment_url: attachmentUrl,
          supabase_id: data.id
        });

        console.log(`Report ${report.id} synced ✅`);

      } catch (err) {
        console.error("Sync error for report", report.id, err);
      }
    }

    onStatusChange("done");
  } catch (err) {
    console.error("Sync failed:", err);
    onStatusChange("error");
  }
}
