"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export type BoardData = {
  id: string;
  title: string;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
};

export function useBoard(boardId: string | null) {
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
    
    const unsubscribe = onSnapshot(boardRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBoard({
            id: docSnap.id,
            ...docSnap.data()
          } as BoardData);
        } else {
          setBoard(null);
          setError("Board not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching board:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  const refetchBoard = useCallback(async () => {
    // Pour la compatibilité, mais maintenant les données sont temps réel
    console.log("Board is now real-time, no manual refetch needed");
  }, []);

  return { board, loading, error, refetch: refetchBoard };
}
