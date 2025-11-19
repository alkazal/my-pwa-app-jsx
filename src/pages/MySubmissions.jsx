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

    // ---- Get session (WORKS OFFLINE) ----
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      if (navigator.onLine) {
        // online but no session
        navigate("/login");
        return;
      }

      // OFFLINE with no supabase session -> load Dexie only
      console.log("Offline mode: loading Dexie only");
      const offlineData = await db.reports.toArray();
      setItems(offlineData);
      setLoading(false);
      return;
    }

    // ---- If online, load from Supabase ----
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setItems(data);
      }
    } else {
      // ---- Offline: Load from Dexie ----
      const offlineData = await db.reports
        .where("user_id")
        .equals(userId)
        .toArray();

      setItems(offlineData);
    }

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
          </div>
        ))}
      </div>
    </div>
  );
}
