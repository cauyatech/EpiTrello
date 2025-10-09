import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
/**
 * mettre à jour order dans firestore
 * @param collectionName "lists" | "cards"
 * @param orderedItems tableau d'objets { id: string }
 */

export async function updateOrderBatch(collectionName: string, orderedItems: { id: string }[])
{
  if (orderedItems.length === 0) return;
  const batch = writeBatch(db);
  orderedItems.forEach((item, index) => {
    if (item.id.startsWith('temp-')) return;
    
    const ref = doc(db, collectionName, item.id);
    batch.update(ref, { 
      order: index * 100,
      updatedAt: new Date()
    });
  });
  try {
    await batch.commit();
  } catch (error) {
    console.error(`Error updating ${collectionName} order:`, error);
    throw error;
  }
}

export function calculateNewOrder(items: { order: number }[], insertIndex: number): number 
{
  if (items.length === 0) return 100;
  if (insertIndex === 0) {
    return Math.max(0, items[0].order - 100);
  }
  if (insertIndex >= items.length) {
    return items[items.length - 1].order + 100;
  }
  const prevOrder = items[insertIndex - 1].order;
  const nextOrder = items[insertIndex].order;
  return Math.floor((prevOrder + nextOrder) / 2);
}
