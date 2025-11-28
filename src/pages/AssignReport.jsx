import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../db";
import { syncReports } from "../lib/sync";

export default function AssignReport() {
  const [reports, setReports] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Re-sync when back online
    const handleOnline = () => {
      syncReports();
      loadData();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);

  }, []);

  async function loadData() {
    setLoading(true);

    // ✅ ONLINE MODE
    if (navigator.onLine) {
      const { data: reportsData, error: repErr } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "Submitted")
        .order("created_at", { ascending: false });

      if (repErr) console.error(repErr);
      else setReports(reportsData || []);

      const { data: techData, error: techErr } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .eq("role", "technician");

      if (techErr) console.error(techErr);
      else setTechnicians(techData || []);

    } 
    // ✅ OFFLINE MODE
    else {
      const offlineReports = await db.reports
        .where("status")
        .equals("Submitted")
        .toArray();

      setReports(offlineReports || []);

      const offlineTech = await db.user_profiles
        ?.where("role")
        ?.equals("technician")
        ?.toArray();

      if (offlineTech) setTechnicians(offlineTech);
    }

    setLoading(false);
  }

  // ✅ Assign action (offline first)
  async function handleAssign(reportId) {
    const technicianId = selectedTech[reportId];

    if (!technicianId) {
      alert("Please select technician");
      return;
    }

    const updateData = {
      assigned_to: technicianId,
      assigned_at: new Date().toISOString(),
      status: "New",
      synced: false   // IMPORTANT: mark for sync
    };

    // ✅ Always update Dexie first (offline-compatible)
    await db.reports.update(reportId, updateData);

    // ✅ If online, update Supabase immediately
    if (navigator.onLine) {
      const { error } = await supabase
        .from("reports")
        .update({
          assigned_to: technicianId,
          assigned_at: new Date().toISOString(),
          status: "New",
        })
        .eq("id", reportId);

      if (error) {
        console.error(error);
        alert("Saved offline - will sync later");
        return;
      }
    }

    alert("✅ Assigned Successfully");

    // ✅ Trigger sync in case user just came online
    syncReports();

    // Refresh UI
    loadData();
  }

  if (loading) return <p className="p-6">Loading reports…</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📋 Assign Reports</h1>

      {reports.length === 0 && (
        <p className="text-gray-500">No reports pending assignment</p>
      )}

      <div className="grid gap-5">
        {reports.map((r) => (
          <div key={r.id} className="p-4 bg-white shadow rounded-lg border">
            <p className="font-bold text-lg">{r.title || "Untitled Report"}</p>
            <p className="text-sm text-gray-600">{r.description}</p>

            <div className="text-sm text-gray-500 mt-1">
              Submitted by: {r.user_id}
            </div>

            <div className="flex gap-3 mt-3">
              <select
                className="border p-2 rounded w-full"
                value={selectedTech[r.id] || ""}
                onChange={(e) =>
                  setSelectedTech({
                    ...selectedTech,
                    [r.id]: e.target.value
                  })
                }
              >
                <option value="">Select technician</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.id}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleAssign(r.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
