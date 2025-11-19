import Dexie from "dexie";

export const db = new Dexie("report_db");

db.version(1).stores({
  reports: "++id, report_type, description, attachment, synced, created_at, user_id",
});