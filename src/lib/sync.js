import { supabase } from "./supabase";
import { db } from "../db";

// UI status listener
let onStatusChange = () => {};
export function setSyncStatusListener(fn) {
  onStatusChange = fn;
}

// Individual report synced listener (for toasts)
let onReportSynced = () => {};
export function setReportSyncedListener(fn) {
  onReportSynced = fn;
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

    // Get unsynced reports for this user
    const unsynced = await db.reports
      .where("synced")
      .equals(false)
      .and(r => r.user_id === user.id)
      .toArray();

    if (unsynced.length === 0) {
      onStatusChange("done");
      return;
    }

    for (const report of unsynced) {
      try {
        let attachmentUrl = report.attachment_url || null;

        // Upload attachment if exists
        if (report.attachment && !report.attachment_url) {
          const filename = `${user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}-${report.attachment.name}`;

          const { error: uploadError } = await supabase.storage
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
        const { data, error: insertError } = await supabase
          .from("reports")
          .insert({
            report_type: report.report_type,
            description: report.description,
            attachment_url: attachmentUrl,
            user_id: user.id,
            created_at: report.created_at,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert failed for report", report.id, insertError);
          continue;
        }

        // Update Dexie row
        await db.reports.update(report.id, {
          synced: true,
          attachment_url: attachmentUrl,
          supabase_id: data.id,
        });

        console.log(`Report ${report.id} synced ✅`);
        onReportSynced(report.description || "Report");

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
