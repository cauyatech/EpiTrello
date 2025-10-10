import { db } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp,
  updateDoc, deleteDoc, doc, orderBy
} from "firebase/firestore";

export type Label = {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt?: any;
  updatedAt?: any;
};

export const LABEL_COLORS = [
  { name: "Red", value: "#ef4444", bg: "bg-red-500", text: "text-white" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-500", text: "text-white" },
  { name: "Yellow", value: "#eab308", bg: "bg-yellow-500", text: "text-black" },
  { name: "Green", value: "#22c55e", bg: "bg-green-500", text: "text-white" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-500", text: "text-white" },
  { name: "Purple", value: "#a855f7", bg: "bg-purple-500", text: "text-white" },
  { name: "Pink", value: "#ec4899", bg: "bg-pink-500", text: "text-white" },
  { name: "Grey", value: "#6b7280", bg: "bg-gray-500", text: "text-white" },
];

export async function listLabels(boardId: string): Promise<Label[]> {
  const ref = collection(db, "labels");
  const q = query(ref, where("boardId", "==", boardId), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function createLabel(boardId: string, name: string, color: string, checkDuplicates: boolean = false) {
  if (checkDuplicates) {
    const existingLabels = await listLabels(boardId);
    const labelExists = existingLabels.some(label => 
      label.name.toLowerCase() === name.toLowerCase()
    );
    
    if (labelExists) {
      throw new Error(`Label "${name}" already exists`);
    }
  }

  const ref = collection(db, "labels");
  const docRef = await addDoc(ref, {
    boardId,
    name,
    color,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef;
}

export async function updateLabel(id: string, data: Partial<Label>) {
  await updateDoc(doc(db, "labels", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteLabel(id: string) {
  await deleteDoc(doc(db, "labels", id));
}

export async function createQuickLabels(boardId: string) {
  const quickLabels = [
    { name: "Priority", color: "#ef4444" },
    { name: "In Progress", color: "#eab308" },
    { name: "Done", color: "#22c55e" },
    { name: "Bug", color: "#f97316" },
    { name: "Feature", color: "#3b82f6" },
  ];

  const existingLabels = await listLabels(boardId);
  const createdLabels = [];
  const skippedLabels = [];

  for (const label of quickLabels) {
    const exists = existingLabels.some(existing => 
      existing.name.toLowerCase() === label.name.toLowerCase()
    );
    
    if (!exists) {
      await createLabel(boardId, label.name, label.color);
      createdLabels.push(label.name);
    } else {
      skippedLabels.push(label.name);
    }
  }

  return { createdLabels, skippedLabels };
}

export async function cleanupDuplicateLabels(boardId: string) {
  const allLabels = await listLabels(boardId);
  const seen = new Map();
  const duplicates = [];

  for (const label of allLabels) {
    const key = `${label.name.toLowerCase()}-${label.color}`;
    if (seen.has(key)) {
      duplicates.push(label.id);
    } else {
      seen.set(key, label);
    }
  }

  for (const duplicateId of duplicates) {
    await deleteLabel(duplicateId);
  }

  return duplicates.length;
}