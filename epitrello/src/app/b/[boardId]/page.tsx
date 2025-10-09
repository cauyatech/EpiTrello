"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { createList, renameList, deleteList } from "@/lib/lists";
import { createCard, updateCard, deleteCard } from "@/lib/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DndContextBoard } from "@/components/dnd/DndContextBoard";
import { SortableList } from "@/components/dnd/SortableList";
import { SortableCard } from "@/components/dnd/SortableCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { updateOrderBatch } from "@/lib/order";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { useRealtimeLists } from "@/hooks/useRealtimeLists";
import { useRealtimeCards } from "@/hooks/useRealtimeCards";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RealtimeIndicator } from "@/components/realtime-indicator";
import { OnlineUsers } from "@/components/online-users";

export default function BoardPage() {
  const { user, loading: authLoading } = useAuth("/signin");
  const { boardId } = useParams<{ boardId: string }>();
  const { board, loading: boardLoading, error: boardError } = useRealtimeBoard(boardId as string);
  const { lists, loading: listsLoading, error: listsError } = useRealtimeLists(boardId as string);
  const { cardsByList, loading: cardsLoading, error: cardsError } = useRealtimeCards(boardId as string);
  
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState<{ [listId: string]: string }>({});
  const [newCardDescription, setNewCardDescription] = useState<{ [listId: string]: string }>({});
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loading = authLoading || boardLoading || listsLoading || cardsLoading;

  if (board && user && board.ownerUid !== user.uid) {
    toast.error("You cannot access this board");
    return <div>Access denied</div>;
  }

  async function handleCreateList() {
    if (!newListTitle.trim() || !boardId) return;
    try {
      const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId;
      await createList(boardIdStr, newListTitle.trim(), lists.length * 100);
      setNewListTitle("");
      toast.success("List created");
    } catch (error: any) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list: " + (error.message || "Unknown error"));
    }
  }

  async function handleCreateCard(listId: string) {
    const title = (newCardTitle[listId] || "").trim();
    if (!title) {
      toast.error("Card title is required.");
      return;
    }

    const description = (newCardDescription[listId] || "").trim();
    const order = ((cardsByList[listId]?.length ?? 0) + 1) * 100;

    try {
      await createCard(boardId as string, listId, title, order, description);
      setNewCardTitle(prev => ({ ...prev, [listId]: "" }));
      setNewCardDescription(prev => ({ ...prev, [listId]: "" }));
      toast.success("Card created");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to create card");
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-64 h-96" />
          ))}
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // ce fera redirect
  }

  if (boardError || listsError || cardsError) {
    const error = boardError || listsError || cardsError;
    toast.error("Error loading board: " + error);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{board?.title ?? "Untitled board"}</h1>
      <DndContextBoard
        lists={lists}
        cardsByList={cardsByList}
        onDragEndCard={async (listId, newCards) => {
          try {
            await updateOrderBatch("cards", newCards);
          } catch (error) {
            console.error("Error reordering cards:", error);
            toast.error("Failed to reorder cards");
          }
        }}
        onDragEndList={async (newLists) => {
          try {
            await updateOrderBatch("lists", newLists);
          } catch (error) {
            console.error("Error reordering lists:", error);
            toast.error("Failed to reorder lists");
          }
        }}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.map(list => (
            <SortableList key={list.id} list={list}>
              <div className="bg-neutral-800 rounded-xl p-3 w-64 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-medium">{list.title}</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>⋯</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent   onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={async () => {
                        const newTitle = prompt("New list title", list.title);
                        if (newTitle?.trim()) {
                          try {
                            await renameList(list.id, newTitle.trim());
                            toast.success("List renamed");
                          } catch (error) {
                            console.error("Error renaming list:", error);
                            toast.error("Failed to rename list");}}}}>Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={async () => {
                          if (confirm("Delete this list and all its cards?")) {
                            try {
                              await deleteList(list.id);
                              toast.success("List deleted");
                            } catch (error) {
                              console.error("Error deleting list:", error);
                              toast.error("Failed to delete list");}}}}>Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <SortableContext items={cardsByList[list.id]?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 mb-2 max-h-96 overflow-y-auto">
                    {cardsByList[list.id]?.map(c => (
                      <div key={c.id} onClick={(e) => {
                        e.stopPropagation();
                        setEditingCard(c);
                        setEditTitle(c.title);
                        setEditDescription(c.description || "");
                      }}>
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
              <Button variant="destructive" onClick={async () => {
                if (editingCard && confirm("Delete this card?")) {
                  try {
                    await deleteCard(editingCard.id);
                    setEditingCard(null);
                    toast.success("Card deleted");
                  } catch (error) {
                    console.error("Error deleting card:", error);
                    toast.error("Failed to delete card");
                  }
                }
              }}>Delete</Button>
              <Button onClick={async () => {
                if (editingCard && editTitle.trim()) {
                  try {
                    await updateCard(editingCard.id, {
                      title: editTitle.trim(),
                      description: editDescription.trim(),
                    });
                    setEditingCard(null);
                    toast.success("Card updated");
                  } catch (error) {
                    console.error("Error updating card:", error);
                    toast.error("Failed to update card");
                  }
                }
              }} disabled={!editTitle.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Realtime connection indicator */}
      <RealtimeIndicator boardId={boardId as string} />
      
      {/* Online users indicator */}
      <OnlineUsers boardId={boardId as string} />
    </main>
  );
}
