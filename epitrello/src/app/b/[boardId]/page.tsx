"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
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
import { useBoard } from "@/hooks/useBoard";
import { useLists } from "@/hooks/useLists";
import { useCards } from "@/hooks/useCards";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LabelManager } from "@/components/label-manager";
import { useLabels } from "@/hooks/useLabels";
import { CardLabels } from "@/components/card-labels";
import { QuickLabels } from "@/components/quick-labels";
import { GlobalSearch } from "@/components/global-search";
import { AdvancedFilters, FilterOptions } from "@/components/advanced-filters";
import { useCardFilters } from "@/hooks/useCardFilters";
import { CardDueDate } from "@/components/card-due-date";

export default function BoardPage() {
  const { user, loading: authLoading } = useAuth("/signin");
  const { boardId } = useParams<{ boardId: string }>();
  const { board, loading: boardLoading, error: boardError, refetch: refetchBoard } = useBoard(boardId as string);
  const { lists, loading: listsLoading, error: listsError, refetch: refetchLists } = useLists(boardId as string);
  const { cardsByList, loading: cardsLoading, error: cardsError, refetch: refetchCards } = useCards(boardId as string);
  const { labels, loading: labelsLoading, error: labelsError, refetch: refetchLabels } = useLabels(boardId as string);
  
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState<{ [listId: string]: string }>({});
  const [newCardDescription, setNewCardDescription] = useState<{ [listId: string]: string }>({});
  const [newCardDueDate, setNewCardDueDate] = useState<{ [listId: string]: string }>({});
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    labels: [],
    dueDate: 'none',
    completed: 'all',
    assignedTo: [],
    hasDescription: null
  });

  const loading = authLoading || boardLoading || listsLoading || cardsLoading || labelsLoading;

  if (process.env.NODE_ENV === 'development') {
    console.log('Loading states:', {
      authLoading,
      boardLoading,
      listsLoading,
      cardsLoading,
      labelsLoading,
      totalLoading: loading
    });
  }

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        refetchBoard(),
        refetchLists(),
        refetchCards(),
        refetchLabels()
      ]);
      toast.success("Data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    }
  }, [refetchBoard, refetchLists, refetchCards, refetchLabels]);

  const handleDragEndCard = useCallback(async (listId: string, newCards: any[]) => {
    try {
      await updateOrderBatch("cards", newCards);
      // Les données se mettront à jour automatiquement grâce aux listeners temps réel
    } catch (error) {
      console.error("Error reordering cards:", error);
      toast.error("Failed to reorder cards");
    }
  }, []);

  const handleDragEndList = useCallback(async (newLists: any[]) => {
    try {
      await updateOrderBatch("lists", newLists);
      // Les données se mettront à jour automatiquement grâce aux listeners temps réel
    } catch (error) {
      console.error("Error reordering lists:", error);
      toast.error("Failed to reorder lists");
    }
  }, []);

  const filteredCardsByList = useCardFilters(cardsByList, advancedFilters);

  // Vérification d'accès uniquement quand les données sont chargées
  if (!loading && board && user && board.ownerUid !== user.uid) {
    return <div className="min-h-screen p-6 text-center text-red-400">Access denied - You cannot access this board</div>;
  }

  async function handleCreateList() {
    if (!newListTitle.trim() || !boardId) return;
    try {
      const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId;
      await createList(boardIdStr, newListTitle.trim(), lists.length * 100);
      setNewListTitle("");
      // Refetch seulement les listes après création
      await refetchLists();
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
    const dueDateStr = newCardDueDate[listId] || "";
    const order = ((cardsByList[listId]?.length ?? 0) + 1) * 100;

    try {
      const cardData: any = {
        title,
        description,
        order
      };
      
      if (dueDateStr) {
        cardData.dueDate = new Date(dueDateStr);
      }
      
      await createCard(boardId as string, listId, title, order, description, cardData.dueDate);
      setNewCardTitle(prev => ({ ...prev, [listId]: "" }));
      setNewCardDescription(prev => ({ ...prev, [listId]: "" }));
      setNewCardDueDate(prev => ({ ...prev, [listId]: "" }));
      // Refetch seulement les cartes après création
      await refetchCards();
      toast.success("Card created");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to create card");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <Skeleton className="h-8 w-64 mb-6 bg-slate-700" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-64 h-96 bg-slate-700" />
          ))}
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!loading && !board) {
    return (
      <div className="min-h-screen p-6 text-center">
        <div className="text-gray-400 mb-4">Board not found</div>
        <Button 
          onClick={() => window.location.href = '/boards'}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Back to Boards
        </Button>
      </div>
    );
  }

  if (boardError || listsError || cardsError) {
    const error = boardError || listsError || cardsError;
    return (
      <div className="min-h-screen p-6 text-center">
        <div className="text-red-400 mb-4">Error loading board: {error}</div>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-500 text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/boards'}
          className="flex items-center gap-2 text-indigo-400 border-indigo-400 hover:bg-indigo-500/20 bg-slate-800 hover:text-indigo-300"
        >
          ← Back to Boards
        </Button>
        <div className="text-sm text-gray-400">
          / {board?.title ?? "Untitled board"}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">{board?.title ?? "Untitled board"}</h1>
        <div className="flex items-center gap-4">
          <GlobalSearch 
            cards={Object.values(filteredCardsByList).flat()}
            lists={lists}
            onCardClick={(card) => {
              setEditingCard(card);
              setEditTitle(card.title);
              setEditDescription(card.description || "");
              setEditDueDate(card.dueDate ? 
                ((card.dueDate as any).toDate ? new Date((card.dueDate as any).toDate()).toISOString().split('T')[0] : 
                 new Date(card.dueDate).toISOString().split('T')[0]) : "");
            }}
          />
          {labels.length === 0 && (
            <QuickLabels boardId={boardId as string} />
          )}
          <Button 
            onClick={refreshAll}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-gray-300 border-slate-600 hover:bg-slate-700 bg-slate-800 hover:text-white">🔄 Refresh
          </Button>
          <Button 
            onClick={async () => {
              const { signOut } = await import("firebase/auth");
              const { auth } = await import("@/lib/firebase");
              await signOut(auth);
              window.location.href = '/signin';}}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-red-400 border-red-400 hover:bg-red-500/20 bg-slate-800 hover:text-red-300">🚪 Logout
          </Button>
        </div>
      </div>
      <AdvancedFilters 
        labels={labels}
        currentFilters={advancedFilters}
        onFiltersChange={setAdvancedFilters}/>
      
      <DndContextBoard
        lists={lists}
        cardsByList={filteredCardsByList}
        onDragEndCard={handleDragEndCard}
        onDragEndList={handleDragEndList}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.map(list => (
            <SortableList key={list.id} list={list}>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 w-64 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-medium text-white">{list.title}</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-white hover:bg-slate-700">⋯</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem 
                        onClick={async () => {
                          const newTitle = prompt("New list title", list.title);
                          if (newTitle?.trim()) {
                            try {
                              await renameList(list.id, newTitle.trim());
                              toast.success("List renamed");
                            } catch (error) {
                              console.error("Error renaming list:", error);
                              toast.error("Failed to rename list");
                            }
                          }
                        }} 
                        className="text-gray-300 hover:bg-slate-700 focus:bg-slate-700"
                      >
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400 hover:bg-red-500/20 focus:bg-red-500/20"
                        onClick={async () => {
                          if (confirm("Delete this list and all its cards?")) {
                            try {
                              await deleteList(list.id);
                              toast.success("List deleted");
                            } catch (error) {
                              console.error("Error deleting list:", error);
                              toast.error("Failed to delete list");
                            }
                          }
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <SortableContext items={filteredCardsByList[list.id]?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 mb-2 max-h-96 overflow-y-auto">
                    {filteredCardsByList[list.id]?.map(c => (
                      <div key={c.id} onClick={(e) => {
                        e.stopPropagation();
                        setEditingCard(c);
                        setEditTitle(c.title);
                        setEditDescription(c.description || "");
                        setEditDueDate(c.dueDate ? 
                          ((c.dueDate as any).toDate ? new Date((c.dueDate as any).toDate()).toISOString().split('T')[0] : 
                           new Date(c.dueDate).toISOString().split('T')[0]) : "");
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
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"/>
                  <textarea
                    placeholder="Card description (optional)"
                    value={newCardDescription[list.id] || ""}
                    onChange={(e) => setNewCardDescription(prev => ({ ...prev, [list.id]: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white placeholder-gray-400 p-2 rounded-md text-sm"rows={2}/>
                  <Input
                    type="date"
                    placeholder="Due date (optional)"
                    value={newCardDueDate[list.id] || ""}
                    onChange={(e) => setNewCardDueDate(prev => ({ ...prev, [list.id]: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleCreateCard(list.id)}
                    size="sm"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    disabled={!newCardTitle[list.id]?.trim()}>Add Card
                  </Button>
                </div>
              </div>
            </SortableList>))}

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 w-64 flex-shrink-0">
            <div className="space-y-2">
              <Input
                placeholder="List title"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"/>
              <Button
                onClick={handleCreateList}
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                disabled={!newListTitle.trim()}>Add List
              </Button>
            </div>
          </div>
        </div>
      </DndContextBoard>

      {/* edit card dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit card</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input 
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Card title"
            />
            <textarea 
              className="bg-slate-700 border border-slate-600 text-white placeholder-gray-400 p-2 rounded-md resize-none" 
              rows={4} 
              value={editDescription} 
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Card description"
            />
            
            {/* Due Date Picker */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Due Date:</label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDueDate("")}
                  className="text-gray-300 border-slate-600 hover:bg-slate-700 bg-slate-800"
                >
                  Clear
                </Button>
              </div>
              {editingCard?.dueDate && (
                <div className="mt-2">
                  <CardDueDate dueDate={editingCard.dueDate} completed={editingCard.completed} />
                </div>
              )}
            </div>

            {editingCard?.labels && editingCard.labels.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Current Labels:</label>
                <CardLabels labels={editingCard.labels} />
              </div>
            )}
            {editingCard && (
              <div className="flex gap-2">
                <LabelManager 
                  card={editingCard} 
                  availableLabels={labels} 
                  boardId={boardId as string}
                  onLabelsChange={async () => {
                    await refetchCards();
                    await refetchLabels();
                  }}/>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="destructive" 
                onClick={async () => {
                  if (editingCard && confirm("Delete this card?")) {
                    try {
                      await deleteCard(editingCard.id);
                      setEditingCard(null);
                      await refetchCards();
                      toast.success("Card deleted");
                    } catch (error) {
                      console.error("Error deleting card:", error);
                      toast.error("Failed to delete card");
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                Delete
              </Button>
              <Button 
                onClick={async () => {
                  if (editingCard && editTitle.trim()) {
                    try {
                      const updateData: any = {
                        title: editTitle.trim(),
                        description: editDescription.trim(),
                      };
                      
                      if (editDueDate) {
                        updateData.dueDate = new Date(editDueDate);
                      } else {
                        updateData.dueDate = null;
                      }
                      
                      await updateCard(editingCard.id, updateData);
                      setEditingCard(null);
                      await refetchCards();
                      toast.success("Card updated");
                    } catch (error) {
                      console.error("Error updating card:", error);
                      toast.error("Failed to update card");
                    }
                  }
                }} 
                disabled={!editTitle.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
