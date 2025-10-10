"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export type CardLabel = {
  id: string;
  name: string;
  color: string;
};

export type Card = {
  id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  order: number;
  labels?: CardLabel[];
  dueDate?: any;
  assignedUsers?: string[];
  completed?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export function useCards(boardId: string | null) {
  const [cardsByList, setCardsByList] = useState<{ [listId: string]: Card[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      setCardsByList({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const cardsRef = collection(db, "cards");
    const q = query(
      cardsRef,
      where("boardId", "==", boardId),
      orderBy("order", "asc")
    );
    
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const cardsData: Card[] = [];
        querySnapshot.forEach((doc) => {
          cardsData.push({
            id: doc.id,
            ...doc.data()
          } as Card);
        });
        
        const grouped: { [listId: string]: Card[] } = {};
        cardsData.forEach(card => {
          if (!grouped[card.listId]) {
            grouped[card.listId] = [];
          }
          grouped[card.listId].push(card);
        });
        
        setCardsByList(grouped);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching cards:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  const refetchCards = useCallback(async () => {
    // Pour la compatibilité, mais maintenant les données sont temps réel
    console.log("Cards are now real-time, no manual refetch needed");
  }, []);

  return { cardsByList, loading, error, refetch: refetchCards };
}
