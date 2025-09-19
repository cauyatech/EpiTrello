"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function UserBadge() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDisplayName(null);
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setDisplayName(snap.data().displayName || user.displayName || user.email || "Anonymous");
      } else {
        setDisplayName(user.displayName || user.email || "Anonymous");
      }
    });
    return () => unsub();
  }, []);

  if (!displayName) return null;

  return (
    <div className="fixed bottom-3 left-3 text-sm text-neutral-400">
      👤 {displayName}
    </div>
  );
}
