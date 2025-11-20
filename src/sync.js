import { db } from "./db";
import { supabase } from "./lib/supabase";

// UI listener for sync status
let onStatusChange = () => {};
export function setSyncStatusListener(fn) {
  onStatusChange = fn;
}

let onReportSynced = () => {};
export function setReportSyncedListener(fn) {
  onReportSynced = fn;
}

export async function syncReports() {
  onStatusChange("syncing");

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    onStatusChange("nosession");
    return;
  }

  const unsynced = await db.reports.where("synced").equals(false).toArray();
  if (unsynced.length === 0) {
    onStatusChange("done");
    return;
  }

  for (const report of unsynced) {
    try {
      let attachmentUrl = report.attachment_url || null;

      // Upload attachment if exists
      if (report.attachment && !report.attachment_url) {
        const filename = `${Date.now()}-${report.attachment.name}`;
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filename, report.attachment);

        if (!uploadError) {
          const { data } = supabase.storage
            .from("attachments")
            .getPublicUrl(filename);
          attachmentUrl = data.publicUrl;
        }
      }

      // Insert into Supabase with user_id
      const { error: insertError } = await supabase.from("reports").insert({
        report_type: report.report_type,
        description: report.description,
        attachment_url: attachmentUrl,
        user_id: user.id,
        created_at: report.created_at,
      });

      if (!insertError) {
        // Mark as synced locally
        await db.reports.update(report.id, { synced: true, attachment_url: attachmentUrl });
        // Notify UI that one report synced
        onReportSynced(report.description || "Report");
      }
    } catch (err) {
      console.error("Sync failed:", err);
    }
  }

  onStatusChange("done");
}
