import { db } from "@/lib/firebase";
import { doc, updateDoc, writeBatch } from "firebase/firestore";

/**
 * Met à jour le champ `order` pour plusieurs documents Firestore
 * @param collectionName "lists" | "cards"
 * @param orderedItems tableau d'objets { id: string }
 */
export async function updateOrderBatch(collectionName: string, orderedItems: { id: string }[]) {
  const batch = writeBatch(db);
  orderedItems.forEach((item, index) => {
    const ref = doc(db, collectionName, item.id);
    batch.update(ref, { order: index * 1 });
  });
  await batch.commit();
}
