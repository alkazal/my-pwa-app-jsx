import Dexie from "dexie";

export const db = new Dexie("report_db");

// db.version(2).stores({
//   reports: "id, report_type, title, description, synced, to_delete, created_at, user_id",
//   attachments: "id, report_id, user_id, synced, to_delete"
// });
db.version(3).stores({
  reports: `
    id,
    user_id,
    assigned_to,
    ticket_no,
    report_type,
    title,
    description,
    status,
    synced,
    to_delete,
    created_at,
    updated_at
  `,
  attachments: `
    id,
    report_id,
    user_id,
    synced,
    to_delete
  `
});