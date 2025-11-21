import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../db";
import { useNavigate } from "react-router-dom";
import { syncReports, setSyncStatusListener, setReportSyncedListener } from "../lib/sync";

export default function MySubmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle");
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      if (navigator.onLine) navigate("/login");
      const offlineData = await db.reports.toArray();
      setItems(offlineData);
      setLoading(false);
      return;
    }

    let onlineData = [];
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error) onlineData = data;
    }

    const offlineData = await db.reports
      .where("user_id")
      .equals(userId)
      .and(r => r.synced === false)
      .toArray();

    setItems([...offlineData, ...onlineData]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    setSyncStatusListener((status) => {
      setSyncStatus(status);
      if (status === "done") loadData();
    });

    // Listen to individual report syncs for toast
    setReportSyncedListener((reportDesc) => {
      setToastMessage(`Report synced: ${reportDesc}`);
    });

    // const handleOnline = () => syncReports();
    // window.addEventListener("online", handleOnline);

    // return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {syncStatus === "syncing" && (
        <p className="text-blue-600 font-medium mb-2">Syncing offline reports...</p>
      )}

      {loading && <p>Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-500">You have no report submissions yet.</p>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
        {items.map((x) => (
          <div key={x.id} className="bg-white shadow rounded-lg p-4">
            {x.attachment_url && (
              <img
                src={x.attachment_url}
                className="w-full h-40 object-cover rounded mb-2"
              />
            )}
            <h2 className="text-lg font-semibold">{x.description}</h2>
            <p className="text-sm text-gray-600">
              {new Date(x.created_at).toLocaleString()}
            </p>
            {!x.synced && <p className="text-red-500 text-xs mt-1">Offline</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
