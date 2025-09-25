import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
