import { useState } from "react";
import { db } from "../db";
import { supabase } from "../lib/supabase";

export default function NewReport() {
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    if (!reportType) return alert("Please select a report type");

    const online = navigator.onLine;

    //const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    // --------------------------
    // OFFLINE MODE
    // --------------------------
    if (!online) {
      await db.reports.add({
        report_type: reportType,
        description,
        attachment,
        synced: false,
        created_at: new Date().toISOString(),
        user_id: user?.id ?? null,
      });

      setStatus("Saved offline — will sync when online");
      return;
    }

    // --------------------------
    // ONLINE MODE
    // --------------------------
    let attachmentUrl = null;

    // Upload file if exists
    if (attachment) {
      const filename = `${Date.now()}-${attachment.name}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filename, attachment);

      if (uploadError) {
        setStatus("Upload failed");
        console.error(uploadError);
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from("attachments")
        .getPublicUrl(filename);

      attachmentUrl = data.publicUrl;
    }

   
    // Insert into Supabase
    const { error: insertError } = await supabase.from("reports").insert({
        report_type: reportType,
        description,
        attachment_url: attachmentUrl,
        user_id: user.id
    });

    if (insertError) {
      setStatus("Failed to submit");
      console.error(insertError);
      return;
    }

    setStatus("Submitted successfully 🎉");

    // Clear form
    setReportType("");
    setDescription("");
    setAttachment(null);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">New Report</h2>

      <div className="bg-white shadow-md rounded-lg p-4 space-y-4">

        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <select
            className="w-full border rounded-md p-2"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="">Select a type</option>
            <option value="Attendance">Attendance</option>
            <option value="Incident">Incident</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded-md p-2 h-32"
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Attachment */}
        <div>
          <label className="block text-sm font-medium mb-1">Attachment</label>
          <input
            type="file"
            className="w-full border rounded-md p-2"
            onChange={(e) => setAttachment(e.target.files[0])}
          />
        </div>

        {/* Submit */}
        <button
          className="bg-blue-600 text-white w-full py-2 rounded-md hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Submit Report
        </button>

        <p className="text-green-700 font-medium mt-2">{status}</p>
      </div>
    </div>
  );
}
