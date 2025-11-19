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

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      if (navigator.onLine) {
        navigate("/login");
        return;
      }
      // offline: load Dexie only
      const offlineData = await db.reports.toArray();
      setItems(offlineData);
      setLoading(false);
      return;
    }

    // Load online/offline reports
    let onlineData = [];
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else onlineData = data;
    }

    const offlineData = await db.reports
      .where("user_id")
      .equals(userId)
      .toArray();

    // Combine offline + online
    const combined = [...offlineData, ...onlineData];

    // Sort by created_at descending
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setItems(combined);
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Reports</h1>

      {loading && <p>Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-500">You have no report submissions yet.</p>
      )}

      {/* Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map((x) => (
          <div key={x.id} className="bg-white shadow rounded-lg p-4 flex flex-col">
            {x.attachment_url && (
              <img
                src={x.attachment_url}
                alt="Attachment"
                className="w-full h-40 object-cover rounded"
              />
            )}
            <h2 className="text-lg font-semibold mt-3">{x.description}</h2>
            <p className="text-sm text-gray-600 mt-auto">
              {new Date(x.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
