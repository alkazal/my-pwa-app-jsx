import { supabase } from "../lib/supabase";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { data } = supabase.auth.getSession();
  const session = data?.session;

  // Even offline, Supabase returns session from localStorage
  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
}


// import { useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";
// import { Navigate } from "react-router-dom";

// export default function PrivateRoute({ children }) {
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const session = supabase.auth.getSession().then(({ data }) => {
//       setUser(data.session?.user ?? null);
//       setLoading(false);
//     });

//     // Optional: listen to auth changes
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         setUser(session?.user ?? null);
//       }
//     );

//     return () => {
//       listener.subscription.unsubscribe();
//     };
//   }, []);

//   if (loading) return <p>Loading...</p>; // show a spinner if needed

//   if (!user) return <Navigate to="/login" replace />;

//   return children;
// }
