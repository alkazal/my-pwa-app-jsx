import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import NewReport from "./pages/NewReport";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MySubmissions from "./pages/MySubmissions";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
        <Link to="/" style={{ marginRight: "10px" }}>Home</Link>
        <Link to="/my-submissions" style={{ marginRight: "10px" }}>My Submissions</Link>
        <Link to="/new">New Report</Link>
      </nav>

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />

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
    </BrowserRouter>
  );
}

