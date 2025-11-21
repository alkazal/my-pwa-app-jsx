import { supabase } from "./supabase";
import { db } from "../db";

let onStatusChange = () => {};
export function setSyncStatusListener(fn) { onStatusChange = fn; }

let onReportSynced = () => {};
export function setReportSyncedListener(fn) { onReportSynced = fn; }

export async function syncReports() {
  console.log("syncReports: start");
  onStatusChange("syncing");

  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("syncReports: session", !!session);
    const user = session?.user;
    if (!user) {
      console.warn("syncReports: no session - abort");
      onStatusChange("nosession");
      return { ok: false, reason: "nosession" };
    }

    // make sure user.id is valid
    if (!user.id || typeof user.id !== "string") {
      console.warn("syncReports: invalid user id", user);
      onStatusChange("nosession");
      return { ok: false, reason: "invalid_user" };
    }

    // safe query: include only rows with valid id & user_id
    const unsyncedAll = await db.reports.filter(r => r && (r.synced === false || r.synced === 0)).toArray();
    console.log("syncReports: unsyncedAll count", unsyncedAll.length);

    // filter client-side for user id to avoid index issues
    const unsynced = unsyncedAll.filter(r => r.user_id === user.id);
    console.log("syncReports: unsynced for user", unsynced.length);

    if (unsynced.length === 0) {
      onStatusChange("done");
      console.log("syncReports: nothing to sync");
      return { ok: true, synced: 0 };
    }

    let syncedCount = 0;

    for (const report of unsynced) {
      if (!report.id) {
        console.warn("skip report without id", report);
        continue;
      }

      try {
        console.log("syncReports: processing report", report.id);

        let attachmentUrl = report.attachment_url || null;

        if (report.attachment && !report.attachment_url) {
          try {
            const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${report.attachment.name || "file"}`;
            console.log("syncReports: uploading", filename, report.attachment);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("attachments")
              .upload(filename, report.attachment);

            if (uploadError) {
              console.error("syncReports: uploadError", uploadError);
              continue; // skip this report, move to next
            }

            const { data: publicData } = supabase.storage
              .from("attachments")
              .getPublicUrl(filename);

            attachmentUrl = publicData?.publicUrl || null;
            console.log("syncReports: uploaded url", attachmentUrl);
          } catch (uplErr) {
            console.error("syncReports: upload thrown", uplErr);
            continue;
          }
        }

        // Insert row
        const insertPayload = {
          report_type: report.report_type,
          description: report.description,
          attachment_url: attachmentUrl,
          user_id: user.id,
          created_at: report.created_at || new Date().toISOString(),
        };
        console.log("syncReports: inserting payload", insertPayload);

        const { data, error: insertError } = await supabase
          .from("reports")
          .insert(insertPayload)
          .select()
          .single();

        if (insertError) {
          console.error("syncReports: insertError", insertError);
          continue;
        }

        await db.reports.update(report.id, {
          synced: true,
          //attachment_url: attachmentUrl,
          supabase_id: data?.id || null,
        });

        console.log(`syncReports: report ${report.id} synced -> supabase id ${data?.id}`);
        syncedCount++;
        try { onReportSynced(report.description || `Report ${report.id}`); } catch(e){}

      } catch (err) {
        console.error("syncReports: per-report error", err, report);
      }
    }

    onStatusChange("done");
    console.log("syncReports: finished, syncedCount=", syncedCount);
    return { ok: true, synced: syncedCount };

  } catch (err) {
    console.error("Sync failed:", err);
    onStatusChange("error");
    return { ok: false, reason: err };
  }
}
