import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../db";
import { supabase } from "../lib/supabase";

// For image modal
function Modal({ url, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <img
        src={url}
        className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [modalUrl, setModalUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------
  // LOAD REPORT (Offline first, then online fallback)
  // ----------------------------------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);

      // 1. Try Dexie first
      const local = await db.reports.get(id);
      if (local) {
        setReport(local);

        local.history = local._status_changes || [];
        
        const att = await db.attachments
          .where("report_id")
          .equals(id)
          .and((a) => !a.to_delete)
          .toArray();
        setAttachments(att);
      }

      // 2. If online → fetch fresh version from Supabase
      if (navigator.onLine) {
        const { data: online, error } = await supabase
          .from("reports")
          .select(
            `
            *,
            reporter:user_id ( full_name ),
            technician:assigned_to ( full_name ),
            history:report_status_history (
              id,
              old_status,
              new_status,
              changed_at,
              comment,
              changed_by,
              changed_by_name
            )
          `
          )
          .eq("id", id)
          .single();

        if (!error && online) {
          setReport(online);

          const { data: onlineAtt } = await supabase
            .from("attachments")
            .select("*")
            .eq("report_id", id);

          setAttachments(onlineAtt || []);
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!report)
    return <p className="p-6 text-red-500">Report not found</p>;

  // ----------------------------------------------------
  // BUILD STATUS TIMELINE (NEW CLEAN VERSION)
  // ----------------------------------------------------
  const timeline = [];

  // 1) Submitted event
  // timeline.push({
  //   label: "Submitted",
  //   at: report.created_at,
  //   by: report.reporter?.full_name || "Unknown user",
  //   comment: "Report submitted"
  // });

  // 2) Assigned → New
  // if (report.assigned_at) {
  //   timeline.push({
  //     label: "Assigned (New)",
  //     at: report.assigned_at,
  //     by: report.technician?.full_name || "Manager",
  //     comment: "Assigned to technician"
  //   });
  // }

  // 3) Status change history from DB
  (report.history || report._status_changes || []).forEach(h => {
    timeline.push({
      label: `${h.old_status} → ${h.new_status}`,
      at: h.changed_at,
      by: h.changed_by_name || h.changed_by,
      comment: h.comment
    });
  });

  // 4) Closed (manager only)
  // if (report.closed_at) {
  //   timeline.push({
  //     label: "Closed",
  //     at: report.closed_at,
  //     by: report.updated_by_name,
  //     comment: report.closing_notes
  //   });
  // }

  // FINAL SORT
  timeline.sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-blue-600 underline mb-4"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-2">{report.title}</h1>

      <p className="text-gray-700">{report.description}</p>

      <div className="mt-3 text-sm text-gray-600">
        <p>
          <b>Ticket No:</b> {report.ticket_no}
        </p>
        <p>
          <b>Status:</b>{" "}
          <span className="text-blue-600">{report.status}</span>
        </p>
        <p>
          <b>Submitted by:</b>{" "}
          {report.reporter?.full_name || report.reporter_name || report.user_id}
        </p>
        {report.technician && (
          <p>
            <b>Assigned to:</b> {report.technician?.full_name || report.technician_name}
          </p>
        )}
      </div>

      {/* ----------------------------------------------------
          ATTACHMENTS
      ---------------------------------------------------- */}
      <h2 className="text-xl font-semibold mt-6 mb-2">
        Attachments ({attachments.length})
      </h2>

      {attachments.length === 0 && (
        <p className="text-gray-500 text-sm">No attachments</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {attachments.map((att) => {
          const isImg = att.mime_type?.startsWith("image/");
          const url =
            att.file_url ||
            (att.file_data && URL.createObjectURL(att.file_data));

          return (
            <div
              key={att.id}
              className="border rounded p-2 bg-white shadow-sm cursor-pointer"
              onClick={() => isImg && setModalUrl(url)}
            >
              {isImg ? (
                <img
                  src={url}
                  className="h-32 w-full object-cover rounded"
                />
              ) : (
                <div className="h-32 bg-gray-200 flex items-center justify-center rounded">
                  📄
                </div>
              )}

              <p className="text-xs mt-1 truncate">{att.file_name}</p>
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {modalUrl && (
        <Modal url={modalUrl} onClose={() => setModalUrl(null)} />
      )}

      {/* ----------------------------------------------------
          STATUS TIMELINE
      ---------------------------------------------------- */}
      <h2 className="text-xl font-semibold mt-8 mb-3">Status Timeline</h2>
      <div className="relative border-l-4 border-blue-600 pl-4 space-y-6">

        {timeline.map((item, i) => (
          <div key={i} className="relative">

            {/* Dot */}
            <div className="absolute -left-3 top-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>

            {/* Title */}
            <p className="font-semibold">{item.label}</p>

            {/* Timestamp + User */}
            <p className="text-sm text-gray-600">
              {new Date(item.at).toLocaleString()}  
              {" — "}
              <span className="font-medium">{item.by}</span>
            </p>

            {/* Comment */}
            {item.comment && (
              <p className="text-gray-700 text-sm mt-1">
                💬 {item.comment}
              </p>
            )}
          </div>
        ))}

      </div>

      
    </div>
  );
}
