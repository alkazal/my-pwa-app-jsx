import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../db";
import { supabase } from "../lib/supabase";

export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    const local = await db.reports.get(id);

    // Try Supabase if local does not exist
    if (!local && navigator.onLine) {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      setReport(data);
      setLoading(false);
      return;
    }

    setReport(local);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!report) return <div className="p-6">Report not found.</div>;

  return (
    <div className="p-6">
      <button
        className="text-blue-600 mb-4"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-2">
        {report.report_type}
      </h1>

      {/* Attachments */}
      {report.attachment_url && (
        <img
          src={report.attachment_url}
          className="w-full rounded-lg mb-4 shadow"
          alt="Attachment"
        />
      )}

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-600 whitespace-pre-line">
          {report.description}
        </p>
      </div>

      {/* Status */}
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <p><strong>Sync Status:</strong> {report.synced ? "Synced" : "Offline (Not synced)"}</p>
        <p><strong>Created:</strong> {new Date(report.created_at).toLocaleString()}</p>
        {report.supabase_id && <p><strong>Supabase ID:</strong> {report.supabase_id}</p>}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        {!report.synced && (
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Sync Now
          </button>
        )}

        <button
          onClick={() => navigate(`/edit/${report.id}`)}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Edit
        </button>

        <button
          onClick={async () => {
            if (confirm("Delete this report?")) {
              await db.reports.delete(report.id);
              navigate("/mysubmission");
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}