import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp,
  updateDoc, deleteDoc, doc, orderBy
} from "firebase/firestore";

export type Board = {
  id: string;
  title: string;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function listBoards(uid: string): Promise<Board[]> {
  const ref = collection(db, "boards");
  const q = query(ref, where("ownerUid", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function createBoard(uid: string, title: string) {
  const ref = collection(db, "boards");
  await addDoc(ref, { title, ownerUid: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function renameBoard(id: string, title: string) {
  await updateDoc(doc(db, "boards", id), { title, updatedAt: serverTimestamp() });
}

export async function deleteBoard(id: string) {
  await deleteDoc(doc(db, "boards", id));
}
