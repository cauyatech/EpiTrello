"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export type Label = {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt?: any;
  updatedAt?: any;
};

export function useLabels(boardId: string | null) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      setLabels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const labelsRef = collection(db, "labels");
    const q = query(
      labelsRef,
      where("boardId", "==", boardId)
    );
    
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const labelsData: Label[] = [];
        querySnapshot.forEach((doc) => {
          labelsData.push({
            id: doc.id,
            ...doc.data()
          } as Label);
        });
        
        setLabels(labelsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching labels:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  const refetchLabels = useCallback(async () => {
    // Pour la compatibilité, mais maintenant les données sont temps réel
    console.log("Labels are now real-time, no manual refetch needed");
  }, []);

  return { labels, loading, error, refetch: refetchLabels };
}
