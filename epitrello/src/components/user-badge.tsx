"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/users";

export default function UserBadge() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDisplayName(null);
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (profile?.displayName) {
        setDisplayName(profile.displayName);
      } else {
        setDisplayName(user.displayName || user.email || "Anonymous");
      }
    });
    return () => unsub();
  }, []);

  if (!displayName) return null;
  return (
    <div className="fixed bottom-3 left-3 text-sm text-gray-400 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 backdrop-blur-sm">
      🧍 {displayName}
    </div>
  );
}
