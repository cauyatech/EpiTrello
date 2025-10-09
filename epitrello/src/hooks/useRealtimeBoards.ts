"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, DocumentData } from "firebase/firestore";

export type Board = {
  id: string;
  title: string;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
};

export function useRealtimeBoards(userUid: string | null) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid) {
      setBoards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const ref = collection(db, "boards");
    const q = query(ref, where("ownerUid", "==", userUid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newBoards: Board[] = [];
        snapshot.forEach((doc) => {
          newBoards.push({
            id: doc.id,
            ...doc.data()
          } as Board);
        });
        setBoards(newBoards);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to boards:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userUid]);

  return { boards, loading, error };
}
