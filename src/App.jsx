import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Home from "./pages/Home";
import NewReport from "./pages/NewReport";
import MySubmissions from "./pages/MySubmissions";

// import PrivateRoute from "./components/PrivateRoute";

import SyncStatus from "./components/SyncStatus";
import { syncReports } from "./lib/sync";

import Navigation from "./components/Navigation";

export default function App() {

  // ------------------------------
  // 🔄 AUTO SYNC WHEN ONLINE
  // ------------------------------
  useEffect(() => {
  // Run at startup if online
  if (navigator.onLine) {
    syncReports();
  }

  // Handle online events ONCE globally
  const handleOnline = () => {
    console.log("App.jsx ONLINE event → syncing once");
    syncReports();
  };

  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}, []);


  return (
    <BrowserRouter>
      <Navigation />

      <div className="pb-20 md:pb-0"> 

        <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* <Route path="/test" element={<TestSession />} /> */}

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-report"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
            // <PrivateRoute>
            //   <NewReport />
            // </PrivateRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <MySubmissions />
            </ProtectedRoute>
          }
        />
        </Routes>
        
      </div>
      
      <SyncStatus />
    </BrowserRouter>
  );
}
