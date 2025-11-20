import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../db";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { syncReports, setSyncStatusListener, setReportSyncedListener } from "../lib/sync";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Home() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | done
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();

  // Load reports
  const loadReports = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setUser(session.user);

    // Online reports
    let onlineReports = [];
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error) onlineReports = data;
    }

    // Offline reports
    const offlineReports = await db.reports
      .where("user_id")
      .equals(session.user.id)
      .toArray();

    setReports([...offlineReports, ...onlineReports]);
    setLoading(false);
  };

  // Hooks inside component
  useEffect(() => {
    loadReports();

    // Listen to sync status changes
    setSyncStatusListener((status) => {
      setSyncStatus(status);
      if (status === "done") loadReports();
    });

    // Listen to individual report syncs for toast
    setReportSyncedListener((reportDesc) => {
      setToastMessage(`Report synced: ${reportDesc}`);
    });

    // Auto-sync when back online
    const handleOnline = () => syncReports();
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const totalReports = reports.length;
  const pendingSync = reports.filter(r => !r.synced).length;
  const recentReports = reports.slice(0, 5);

  const reportTypes = ["Attendance", "Incident", "Maintenance"];
  const chartData = reportTypes.map(type => ({
    type,
    online: reports.filter(r => r.report_type === type && r.synced).length,
    offline: reports.filter(r => r.report_type === type && !r.synced).length,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">
        Welcome, {user?.email ?? "User"}!
      </h1>

      {syncStatus === "syncing" && (
        <p className="text-blue-600 font-medium mb-4">Syncing offline reports...</p>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Total Reports</p>
          <p className="text-2xl font-bold">{totalReports}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Pending Sync</p>
          <p className="text-2xl font-bold">{pendingSync}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Recent Reports</p>
          <p className="text-2xl font-bold">{recentReports.length}</p>
        </div>
      </div>

      {/* Stacked Chart */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Reports by Type (Online vs Offline)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="type" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="online" stackId="a" fill="#3b82f6" />
            <Bar dataKey="offline" stackId="a" fill="#f87171" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Reports</h2>
        {loading ? (
          <p>Loading...</p>
        ) : recentReports.length === 0 ? (
          <p className="text-gray-500">No reports yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReports.map((r) => (
              <div key={r.id} className="bg-white shadow rounded-lg p-4">
                {r.attachment_url && (
                  <img
                    src={r.attachment_url}
                    alt="Attachment"
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <p className="font-semibold">{r.report_type}</p>
                <p className="text-gray-600 text-sm truncate">{r.description}</p>
                <p className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString()}
                </p>
                {!r.synced && <p className="text-red-500 text-xs mt-1">Offline</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/new")}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
      >
        Submit New Report
      </button>

      <Toast
        message={toastMessage}
        onClose={() => setToastMessage("")}
      />
    </div>
  );
}
