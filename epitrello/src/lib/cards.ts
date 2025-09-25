import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp,
  updateDoc, deleteDoc, doc, orderBy
} from "firebase/firestore";

export type Card = {
  id: string;
  boardId: string;
  listId: string;
  title: string;
  description?: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
};

export async function listCards(boardId: string, listId: string): Promise<Card[]> {
  const ref = collection(db, "cards");
  const q = query(ref,
    where("boardId", "==", boardId),
    where("listId", "==", listId),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function createCard(boardId: string, listId: string, title: string, order: number, description = "") {
  const ref = collection(db, "cards");
  await addDoc(ref, {
    boardId, listId, title, description, order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCard(id: string, data: Partial<Card>) {
  await updateDoc(doc(db, "cards", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCard(id: string) {
  await deleteDoc(doc(db, "cards", id));
}
