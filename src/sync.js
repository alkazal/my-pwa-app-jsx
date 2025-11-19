import { db } from "./db";
import { supabase } from "./lib/supabase";

export async function syncReports() {
  const unsynced = await db.reports.where("synced").equals(false).toArray();

  for (const report of unsynced) {
    let attachmentUrl = null;

    if (report.attachment) {
      const filename = `${Date.now()}-${report.attachment.name}`;
      await supabase.storage
        .from("attachments")
        .upload(filename, report.attachment);

      attachmentUrl = supabase.storage
        .from("attachments")
        .getPublicUrl(filename).data.publicUrl;
    }

    await supabase.from("reports").insert({
      report_type: report.report_type,
      description: report.description,
      attachment_url: attachmentUrl
    });

    await db.reports.update(report.id, { synced: true });
  }
}
