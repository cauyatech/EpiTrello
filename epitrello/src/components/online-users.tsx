"use client";

import { useEffect, useState } from "react";
import { onSnapshot, collection, query, where, serverTimestamp, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface OnlineUser {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  lastSeen: any;
}

export function OnlineUsers({ boardId }: { boardId: string }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [presenceDoc, setPresenceDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !boardId) return;

    const addPresence = async () => {
      try {
        const presenceRef = await addDoc(collection(db, "boardPresence"), {
          boardId,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          lastSeen: serverTimestamp(),
        });
        setPresenceDoc(presenceRef.id);
      } catch (error) {
        console.error("Error adding presence:", error);
      }
    };

    const q = query(
      collection(db, "boardPresence"),
      where("boardId", "==", boardId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: OnlineUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const now = Date.now();
        const lastSeen = data.lastSeen?.toDate?.()?.getTime() || 0;
        if (now - lastSeen < 30000) {
          users.push({
            id: doc.id,
            ...data
          } as OnlineUser);
        }
      });
      setOnlineUsers(users);
    });
    addPresence();
    const interval = setInterval(async () => {
      if (presenceDoc) {
        try {
          await addDoc(collection(db, "boardPresence"), {
            boardId,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            lastSeen: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating presence:", error);
        }
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      if (presenceDoc) {
        deleteDoc(doc(db, "boardPresence", presenceDoc)).catch(console.error);
      }
    };
  }, [user, boardId, presenceDoc]);

  if (onlineUsers.length <= 1) return null;

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-lg">
      <span className="text-sm text-neutral-300">Online:</span>
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-neutral-800"
            title={user.displayName || user.email}
          >
            {(user.displayName || user.email)?.[0]?.toUpperCase()}
          </div>
        ))}
        {onlineUsers.length > 5 && (
          <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-neutral-800">
            +{onlineUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
