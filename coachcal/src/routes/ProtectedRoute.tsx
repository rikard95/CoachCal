import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Props = {
  children: ReactNode;
  role: "coach" | "client";
};

export default function ProtectedRoute({ children, role }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      const userRole = snap.data()?.role;

      setAllowed(userRole === role);
    });

    return () => unsub();
  }, [role]);

  if (allowed === null) return <div>Loading...</div>;
  if (!allowed) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
