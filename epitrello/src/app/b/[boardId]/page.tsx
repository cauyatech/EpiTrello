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
import { DndContextBoard } from "@/components/dnd/DndContextBoard";
import { SortableList } from "@/components/dnd/SortableList";
import { SortableCard } from "@/components/dnd/SortableCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { updateOrderBatch } from "@/lib/order";
import { toast } from "sonner";

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
  const title = (newCardTitle[listId] || "").trim();
  if (!title) {
    toast.error("Card title is required.");
    return;
  }

  const description = (newCardDescription[listId] || "").trim();
  const order = ((cards[listId]?.length ?? 0) + 1);

  try {
    await createCard(boardId as string, listId, title, order, description);
    setNewCardTitle(prev => ({ ...prev, [listId]: "" }));
    setNewCardDescription(prev => ({ ...prev, [listId]: "" }));
    await reload();
    toast.success("Card created");
  } catch (err: any) {
    console.error(err);
    toast.error(err?.message ?? "Failed to create card");
  }
}

return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{boardTitle ?? "Untitled board"}</h1>
      <DndContextBoard
        lists={lists}
        cardsByList={cards}
        onDragEndCard={async (listId, newCards) => {
          setCards(prev => ({ ...prev, [listId]: newCards }));
          await updateOrderBatch("cards", newCards);
        }}
        onDragEndList={async (newLists) => {
          setLists(newLists);
          await updateOrderBatch("lists", newLists);}}>
        <div className="flex gap-4 overflow-x-auto">
          {lists.map(list => (
            <SortableList key={list.id} list={list}>
              <div className="bg-neutral-800 rounded-xl p-3 w-64 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-medium">{list.title}</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">⋯</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        const newTitle = prompt("New list title", list.title);
                        if (newTitle) {
                          renameList(list.id, newTitle.trim());
                          reload();}}}>Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          if (confirm("Delete this list and all its cards?")) {
                            deleteList(list.id);
                            reload();}}}>Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <SortableContext items={cards[list.id]?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 mb-2">
                    {cards[list.id]?.map(c => (
                      <div key={c.id} onClick={() => {
                        setEditingCard(c);
                        setEditTitle(c.title);
                        setEditDescription(c.description || "");}}>
                        <SortableCard card={c} />
                      </div>))}
                  </div>
                </SortableContext>

                {/* change cardform*/}
                <div className="space-y-2">
                  <Input
                    placeholder="Card title"
                    value={newCardTitle[list.id] || ""}
                    onChange={(e) => setNewCardTitle(prev => ({ ...prev, [list.id]: e.target.value }))}
                    className="bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400"/>
                  <textarea
                    placeholder="Card description (optional)"
                    value={newCardDescription[list.id] || ""}
                    onChange={(e) => setNewCardDescription(prev => ({ ...prev, [list.id]: e.target.value }))}
                    className="w-full bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 p-2 rounded-md text-sm"rows={2}/>
                  <Button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleCreateCard(list.id)}
                    size="sm"
                    className="w-full"
                    disabled={!newCardTitle[list.id]?.trim()}>Add Card
                  </Button>
                </div>
              </div>
            </SortableList>))}

          {/* Add new list */}
          <div className="bg-neutral-800 rounded-xl p-3 w-64 flex-shrink-0">
            <div className="space-y-2">
              <Input
                placeholder="List title"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                className="bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400"/>
              <Button
                onClick={handleCreateList}
                size="sm"
                className="w-full"
                disabled={!newListTitle.trim()}>Add List
              </Button>
            </div>
          </div>
        </div>
      </DndContextBoard>

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
