"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export type ListData = {
  id: string;
  title: string;
  boardId: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
};

export function useLists(boardId: string | null) {
  const [lists, setLists] = useState<ListData[]>([]);
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

    const listsRef = collection(db, "lists");
    const q = query(
      listsRef,
      where("boardId", "==", boardId),
      orderBy("order", "asc")
    );
    
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const listsData: ListData[] = [];
        querySnapshot.forEach((doc) => {
          listsData.push({
            id: doc.id,
            ...doc.data()
          } as ListData);
        });
        
        setLists(listsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching lists:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  const refetchLists = useCallback(async () => {
    // Pour la compatibilité, mais maintenant les données sont temps réel
    console.log("Lists are now real-time, no manual refetch needed");
  }, []);

  return { lists, loading, error, refetch: refetchLists };
}
