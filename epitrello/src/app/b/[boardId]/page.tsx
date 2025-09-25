"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { List, listLists, createList, renameList, deleteList } from "@/lib/lists";
import { Card, listCards, createCard, updateCard, deleteCard } from "@/lib/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";


export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<{ [listId: string]: Card[] }>({});
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState<{ [listId: string]: string }>({});
  const [newCardDescription, setNewCardDescription] = useState<{ [listId: string]: string }>({});
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [boardTitle, setBoardTitle] = useState<string | null>(null);



useEffect(() => {
  if (!boardId) return;

  async function fetchBoard() {
    const snap = await getDoc(doc(db, "boards", boardId as string));
    if (snap.exists()) {
      setBoardTitle(snap.data().title);
    } else {
      setBoardTitle(null);
    }
  }

  fetchBoard();
  reload(); // continue à charger lists + cards
}, [boardId]);

  async function reload() {
    const ls = await listLists(boardId!);
    setLists(ls);

    const cs: { [listId: string]: Card[] } = {};
    for (const l of ls) {
      cs[l.id] = await listCards(boardId!, l.id);
    }
    setCards(cs);
  }

  async function handleCreateList() {
    if (!newListTitle.trim()) return;
    await createList(boardId!, newListTitle.trim(), lists.length * 100);
    setNewListTitle("");
    reload();
  }

async function handleCreateCard(listId: string) {
  const title = newCardTitle[listId]?.trim();
  if (!title) return;
  const description = newCardDescription[listId]?.trim() || "";
  await createCard(boardId!, listId, title, (cards[listId]?.length || 0) * 100, description);
  setNewCardTitle(prev => ({ ...prev, [listId]: "" }));
  setNewCardDescription(prev => ({ ...prev, [listId]: "" }));
  reload();
}

return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{boardTitle ?? "Untitled board"}</h1>
      <div className="flex gap-4 overflow-x-auto">
        {lists.map(l => (<div key={l.id} className="bg-neutral-800 rounded-xl p-3 w-64 flex-shrink-0">
            {/* list & menu */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium">{l.title}</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">⋮</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-black">
                  <DropdownMenuItem onClick={async () => { const t = prompt("New list title?", l.title);
                    if (t) {
                      await renameList(l.id, t);
                      reload();
                    }}}> Rename</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500" onClick={async () => {
                      if (confirm("Delete this list?")) {
                        await deleteList(l.id);
                        reload();}}}>Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* cards */}
            <div className="space-y-2">
              {cards[l.id]?.map(c => (<div key={c.id} className="bg-neutral-700 rounded-md p-2 text-sm cursor-pointer hover:bg-neutral-600" onClick={() => {
                    setEditingCard(c);
                    setEditTitle(c.title);
                    setEditDescription(c.description || "");}}>
                  <p className="font-medium">{c.title}</p>
                  {c.description && (<p className="text-xs text-neutral-300 line-clamp-2">{c.description}</p>)}
                </div>))}
            </div>
            {/* dialog des cards */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="mt-2 w-full">+ Add card</Button>
              </DialogTrigger>
              <DialogContent className="bg-white text-black">
                <DialogHeader>
                  <DialogTitle>New card</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <Input className="bg-gray-100 text-black" placeholder="Card title" value={newCardTitle[l.id] || ""}
                    onChange={e => setNewCardTitle(prev => ({ ...prev, [l.id]: e.target.value }))}/>
                  <textarea className="bg-gray-100 text-black p-2 rounded-md border border-gray-300" placeholder="Card description" rows={3}
                    value={newCardDescription[l.id] || ""}
                    onChange={e => setNewCardDescription(prev => ({ ...prev, [l.id]: e.target.value }))}/>
                  <Button className="bg-black text-white hover:bg-gray-800" onClick={() => handleCreateCard(l.id)}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>))}
        {/* ajout dialog des list */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-64 h-24">+ Add list</Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-black">
            <DialogHeader>
              <DialogTitle>New list</DialogTitle>
            </DialogHeader>
            <Input className="bg-gray-100 text-black" placeholder="List title" value={newListTitle} onChange={e => setNewListTitle(e.target.value)} />
            <Button onClick={handleCreateList}>Create</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* edit card dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input className="bg-gray-100 text-black" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}/>
            <textarea className="bg-gray-100 text-black p-2 rounded-md border border-gray-300" rows={4} value={editDescription} 
              onChange={(e) => setEditDescription(e.target.value)}/>
            <div className="flex justify-between">
              <Button variant="destructive"  onClick={async () => {
                  if (editingCard && confirm("Delete this card?")) {
                    await deleteCard(editingCard.id);
                    setEditingCard(null);
                    reload();}}}>Delete</Button>
              <Button onClick={async () => {
                  if (editingCard) {
                    await updateCard(editingCard.id, {
                      title: editTitle,
                      description: editDescription,
                    });
                    setEditingCard(null);
                    reload();}}}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
