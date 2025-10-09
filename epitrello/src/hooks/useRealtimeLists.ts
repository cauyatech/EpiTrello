"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, DocumentData } from "firebase/firestore";
import { List } from "@/lib/lists";

export function useRealtimeLists(boardId: string | null) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      setLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const ref = collection(db, "lists");
    const q = query(
      ref, 
      where("boardId", "==", boardId), 
      orderBy("order", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newLists: List[] = [];
        snapshot.forEach((doc) => {
          newLists.push({
            id: doc.id,
            ...doc.data()
          } as List);
        });
        setLists(newLists);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to lists:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  return { lists, loading, error };
}
