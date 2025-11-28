import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../db";
import { supabase } from "../lib/supabase";
import { deleteReport } from "../utils/deleteReport";

export default function ReportDetails() {
  const { id } = useParams();       // report_id
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  // -----------------------------------------------------------
  // Load report + attachments (offline-first)
  // -----------------------------------------------------------
  useEffect(() => {
    async function loadReport() {
      setLoading(true);

      // 1️⃣ Try Local DB first
      let localReport = await db.reports.get(id);

      if (localReport) {
        setReport(localReport);
        const localAtt = await db.attachments.where("report_id").equals(id).toArray();
        setAttachments(localAtt);
        setLoading(false);
        return;
      }

      // 2️⃣ If offline & no local report -> stop
      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      // 3️⃣ Otherwise fetch from Supabase
      const { data: onlineReport } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      if (onlineReport) {
        setReport(onlineReport);

        // fetch attachments metadata
        const { data: onlineAttachments } = await supabase
          .from("attachments")
          .select("*")
          .eq("report_id", id);

        setAttachments(onlineAttachments || []);
      }

      setLoading(false);
    }

    loadReport();
  }, [id]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setPreviewFile(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  if (!report)
    return (
      <div className="p-4">
        <p className="text-red-500">Report not found (offline and not cached).</p>
      </div>
    );

  return (
    <div className="p-4">
      {/* BACK BUTTON */}
      <button
        className="mb-3 text-blue-600 underline text-sm"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* REPORT HEADER */}
      <h1 className="text-xl font-bold">{report.title}</h1>
      <p className="text-gray-600 text-sm">{report.report_type}</p>

      <p className="mt-3">{report.description}</p>

      {/* CREATED DATE */}
      {report.created_at && (
        <p className="mt-2 text-xs text-gray-500">
          Created at: {new Date(report.created_at).toLocaleString()}
        </p>
      )}

      {/* ------------------------------------------------------- */}
      {/* ATTACHMENTS SECTION */}
      {/* ------------------------------------------------------- */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">
          Attachments ({attachments.length})
        </h3>

        {attachments.length === 0 && (
          <p className="text-gray-500 text-sm">No attachments.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {attachments.map((att) => {
            const isImage = att.mime_type?.startsWith("image");

            // Fallback URL:
            // - If online: att.file_url
            // - If offline: att.file_data or att.file (Blob)
            let fileUrl = att.file_url;

            if (!fileUrl && (att.file || att.file_data)) {
              // Convert blob to URL
              fileUrl = URL.createObjectURL(att.file || att.file_data);
            }

            return (
              <div
                key={att.id}
                className="border rounded-md p-2 shadow-sm bg-white"
              >
                {/* Thumbnail Preview */}
                {isImage ? (
                  <img
                      src={fileUrl}
                      alt={att.file_name}
                      onClick={() =>
                        setPreviewFile({
                          url: fileUrl,
                          name: att.file_name,
                          type: att.mime_type,
                        })
                      }
                      className="w-full h-28 object-cover rounded cursor-pointer hover:opacity-80"
                    />
                ) : (
                  <div className="w-full h-28 bg-gray-200 flex items-center justify-center rounded">
                    <span className="text-gray-600 text-sm">📄 File</span>
                  </div>
                )}

                {/* Filename */}
                <p className="text-xs mt-2 text-gray-700 truncate">
                  {att.file_name}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      setPreviewFile({
                        url: fileUrl,
                        name: att.file_name,
                        type: att.mime_type,
                      })
                    }
                    className="text-blue-600 text-xs underline"
                  >
                    View
                  </button>

                  <a
                    href={fileUrl}
                    download={att.file_name}
                    className="text-blue-600 text-xs underline"
                  >
                    Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT BUTTON */}
      <button
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded"
        onClick={() => navigate(`/report/${id}/edit`)}
      >
        Edit Report
      </button>
      <button
        className="mt-6 w-full bg-red-600 text-white py-2 rounded"
        onClick={async () => {
          if (confirm("Delete this report?")) {
            await deleteReport(report);
            navigate("/");
          }
        }}        
      >
        Delete
      </button>

      {/* ===================== PREVIEW MODAL ===================== */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg p-4 relative">
            
            {/* Close button */}
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg"
            >
              ✕
            </button>

            {/* File name */}
            <p className="text-sm mb-3 font-semibold truncate">
              {previewFile.name}
            </p>

            {/* Preview content */}
            {previewFile.type?.startsWith("image") ? (
              <img
                src={previewFile.url}
                className="w-full max-h-[75vh] object-contain rounded"
              />
            ) : previewFile.type === "application/pdf" ? (
              <iframe
                src={previewFile.url}
                className="w-full h-[75vh] rounded"
                title="PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center p-10">
                <p className="mb-4">Cannot preview this file type</p>
                <a
                  href={previewFile.url}
                  download
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Download
                </a>
              </div>
            )}

            {/* Bottom actions */}
            <div className="mt-4 flex justify-end gap-3">
              <a
                href={previewFile.url}
                download
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Download
              </a>
              <button
                onClick={() => setPreviewFile(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>    
  );
}
