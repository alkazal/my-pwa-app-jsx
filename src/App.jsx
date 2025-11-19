import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useEffect } from "react";

import Home from "./pages/Home";
import NewReport from "./pages/NewReport";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MySubmissions from "./pages/MySubmissions";
import PrivateRoute from "./components/PrivateRoute";
import TestSession from "./TestSession";
import SyncStatus from "./components/SyncStatus";

import { syncReports } from "./lib/sync";

export default function App() {

  // ------------------------------
  // 🔄 AUTO SYNC WHEN ONLINE
  // ------------------------------
  useEffect(() => {
    // Run at startup if online
    if (navigator.onLine) {
      syncReports();
    }

    // Run every time the browser goes online
    window.addEventListener("online", syncReports);

    return () => {
      window.removeEventListener("online", syncReports);
    };
  }, []);

  return (
    <BrowserRouter>
      <nav style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
        <Link to="/" style={{ marginRight: "10px" }}>Home</Link>
        <Link to="/my-submissions" style={{ marginRight: "10px" }}>My Reports</Link>
        <Link to="/new">New Report</Link>
      </nav>

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />

        <Route path="/test" element={<TestSession />} />

        {/* Protected routes */}
        <Route
          path="/new"
          element={
            <PrivateRoute>
              <NewReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-submissions"
          element={
            <PrivateRoute>
              <MySubmissions />
            </PrivateRoute>
          }
        />
      </Routes>
      <SyncStatus />
    </BrowserRouter>
  );
}
