"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, DocumentData } from "firebase/firestore";
import { Card } from "@/lib/cards";

export function useRealtimeCards(boardId: string | null) {
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

    const ref = collection(db, "cards");
    const q = query(
      ref,
      where("boardId", "==", boardId),
      orderBy("listId", "asc"),
      orderBy("order", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newCardsByList: { [listId: string]: Card[] } = {};
        
        snapshot.forEach((doc) => {
          const card = {
            id: doc.id,
            ...doc.data()
          } as Card;
          
          if (!newCardsByList[card.listId]) {
            newCardsByList[card.listId] = [];
          }
          newCardsByList[card.listId].push(card);
        });
        setCardsByList(newCardsByList);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to cards:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  return { cardsByList, loading, error };
}
