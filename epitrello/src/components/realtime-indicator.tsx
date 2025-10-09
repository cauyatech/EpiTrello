"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function RealtimeIndicator({ boardId }: { boardId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!boardId) return;

    const boardRef = doc(db, "boards", boardId);
    const unsubscribe = onSnapshot(
      boardRef,
      (doc) => {
        setIsConnected(true);
        setLastUpdate(new Date());
      },
      (error) => {
        console.error("Realtime connection error:", error);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-lg text-sm">
      <div 
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span>
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      {lastUpdate && (
        <span className="text-neutral-400 text-xs">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
