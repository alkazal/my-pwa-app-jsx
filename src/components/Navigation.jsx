import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import HomeIcon from "@heroicons/react/24/outline/HomeIcon";
import ClipboardDocumentListIcon from "@heroicons/react/24/outline/ClipboardDocumentListIcon";
import PlusCircleIcon from "@heroicons/react/24/outline/PlusCircleIcon";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon"; 

export default function Navigation() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-semibold"
      : "text-gray-600";

  return (
    <>
      {/* TOP NAV (Desktop) */}
      <nav className="hidden md:flex items-center justify-between bg-white shadow px-6 py-3 sticky top-0 z-50">
        <div className="flex space-x-6 text-lg">
          <NavLink to="/" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/submissions" className={linkClass}>Reports</NavLink>
          <NavLink to="/new-report" className={linkClass}>New Report</NavLink>
        </div>

        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-2"
        >
          <ArrowRightIcon  className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>

      {/* BOTTOM TAB NAV (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-inner border-t z-50">
        <div className="flex justify-around py-2">
          <NavLink to="/" className="flex flex-col items-center">
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </NavLink>

          <NavLink to="/submissions" className="flex flex-col items-center">
            <ClipboardDocumentListIcon className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </NavLink>

          <NavLink to="/new-report" className="flex flex-col items-center">
            <PlusCircleIcon className="w-6 h-6" />
            <span className="text-xs">New</span>
          </NavLink>

          <button onClick={handleLogout} className="flex flex-col items-center text-red-600">
            <ArrowRightIcon  className="w-6 h-6" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
