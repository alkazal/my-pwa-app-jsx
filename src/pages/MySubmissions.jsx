import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../db";
import { useNavigate } from "react-router-dom";

export default function MySubmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

 async function loadData() {
  setLoading(true);

  // --- Get session from Supabase (works offline) ---
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  // If offline and no user session stored → Dexie only
  if (!navigator.onLine || !userId) {
    console.log("Offline mode or no session → show Dexie only");

    const offlineData = await db.reports
      .filter(r => r.user_id === userId || !userId)   // allow unsynced data
      .toArray();

    setItems(offlineData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setLoading(false);
    return;
  }

  // ----- ONLINE MODE -----
  // 1. Load from Supabase
  const { data: onlineReports, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  // 2. Load offline unsynced reports from Dexie
  const offlineReports = await db.reports
    .filter(r => r.synced === false || r.synced === undefined)
    .toArray();

  // 3. Merge them → always show both
  const merged = [
    ...offlineReports.map(r => ({ ...r, isOffline: true })), // mark as offline
    ...onlineReports
  ];

  // 4. Sort newest first
  merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  setItems(merged);
  setLoading(false);
}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Reports</h1>

      {loading && <p>Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-500">You have no report submissions yet.</p>
      )}

      <div className="grid gap-4 mt-4">
        {items.map((x) => (
          <div key={x.id} className="bg-white shadow rounded-lg p-4">
            {x.attachment_url && (
              <img
                src={x.attachment_url}
                className="w-full h-40 object-cover rounded"
              />
            )}
            <h2 className="text-lg font-semibold mt-3">
              {x.description}
            </h2>

            <p className="text-sm text-gray-600">
              {new Date(x.created_at).toLocaleString()}
            </p>

            {x.isOffline && (
              <span className="text-xs bg-yellow-300 text-black px-2 py-1 rounded">
                Offline (Not Synced)
              </span>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
