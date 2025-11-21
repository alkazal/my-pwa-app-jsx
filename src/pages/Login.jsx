import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setStatus("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus("Invalid login credentials");
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-2xl font-bold text-center mb-6">HELPDESK</h1>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />          
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          Login
        </button>

        {/* Status Message */}
        {status && (
          <p className="text-red-600 text-center mt-3 text-sm">{status}</p>
        )}

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Register here
            </a>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
