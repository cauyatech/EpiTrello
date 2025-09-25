import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp,
  updateDoc, deleteDoc, doc, orderBy
} from "firebase/firestore";

export type List = {
  id: string;
  boardId: string;
  title: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
};

export async function listLists(boardId: string): Promise<List[]> {
  const ref = collection(db, "lists");
  const q = query(ref, where("boardId", "==", boardId), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function createList(boardId: string, title: string, order: number) {
  const ref = collection(db, "lists");
  await addDoc(ref, {
    boardId, title, order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function renameList(id: string, title: string) {
  await updateDoc(doc(db, "lists", id), { title, updatedAt: serverTimestamp() });
}

export async function deleteList(id: string) {
  await deleteDoc(doc(db, "lists", id));
}
