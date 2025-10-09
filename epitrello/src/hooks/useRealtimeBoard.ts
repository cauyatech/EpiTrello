"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";

export type BoardData = {
  id: string;
  title: string;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
};

export function useRealtimeBoard(boardId: string | null) {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      setBoard(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const boardRef = doc(db, "boards", boardId);

    const unsubscribe = onSnapshot(
      boardRef,
      (doc) => {
        if (doc.exists()) {
          setBoard({
            id: doc.id,
            ...doc.data()
          } as BoardData);
        } else {
          setBoard(null);
          setError("Board not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to board:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  return { board, loading, error };
}
