"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export type BoardData = {
  id: string;
  title: string;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
};

export function useBoards(userId: string | null) {
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    if (!userId) {
      setBoards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const boardsRef = collection(db, "boards");
      const q = query(
        boardsRef,
        where("ownerUid", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const boardsData: BoardData[] = [];
      
      querySnapshot.forEach((doc) => {
        boardsData.push({
          id: doc.id,
          ...doc.data()
        } as BoardData);
      });
      
      setBoards(boardsData);
    } catch (err: any) {
      console.error("Error fetching boards:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [userId]);

  return { boards, loading, error, refetch: fetchBoards };
}
