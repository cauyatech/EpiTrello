"use client";

import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { updateCard } from "@/lib/cards";

export function DndContextBoard({
  lists,
  cardsByList,
  onDragEndCard,
  onDragEndList,
  children,
}: {
  lists: any[];
  cardsByList: Record<string, any[]>;
  onDragEndCard: (listId: string, newCards: any[]) => Promise<void>;
  onDragEndList: (newLists: any[]) => Promise<void>;
  children: React.ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  }
  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    // bouger la lisat
    try {
      const isActiveList = lists.find(l => l.id === activeId);
      const isOverList = lists.find(l => l.id === overId);
      
      if (isActiveList && isOverList) {
        const oldIndex = lists.findIndex(l => l.id === activeId);
        const newIndex = lists.findIndex(l => l.id === overId);
        if (oldIndex !== newIndex) {
          const newOrder = arrayMove(lists, oldIndex, newIndex);
          await onDragEndList(newOrder);
        }
        return;
      }
      const fromListId = Object.keys(cardsByList).find(listId =>
        cardsByList[listId]?.some(c => c.id === activeId)
      );
      if (!fromListId) return
      const fromCards = cardsByList[fromListId] || [];
      const activeCard = fromCards.find(c => c.id === activeId);
      if (!activeCard) return;

      let toListId = fromListId;
      let newIndex = fromCards.length;
      const overListId = Object.keys(cardsByList).find(listId =>
        cardsByList[listId]?.some(c => c.id === overId)
      );
      if (overListId) {
        toListId = overListId;
        const toCards = cardsByList[toListId] || [];
        newIndex = toCards.findIndex(c => c.id === overId);
      } else if (lists.find(l => l.id === overId)) {
        toListId = overId;
        newIndex = cardsByList[toListId]?.length || 0;
      }
      const oldIndex = fromCards.findIndex(c => c.id === activeId);
      if (fromListId === toListId) {
        if (oldIndex !== newIndex) {
          const reordered = arrayMove(fromCards, oldIndex, newIndex);
          await onDragEndCard(fromListId, reordered);
        }
      } else {
        // update la db pour le move des cards
        const updatedFrom = fromCards.filter(c => c.id !== activeId);
        const toCards = cardsByList[toListId] || [];
        const updatedTo = [
          ...toCards.slice(0, newIndex),
          { ...activeCard, listId: toListId },
          ...toCards.slice(newIndex),
        ];
        // changer l'id dla list
        await updateCard(activeCard.id, { listId: toListId });
        await onDragEndCard(fromListId, updatedFrom);
        await onDragEndCard(toListId, updatedTo);
      }
    } catch (error) {
      console.error("Error during drag and drop:", error);
    }
  }
  const activeCard = activeId ? Object.values(cardsByList).flat().find(c => c.id === activeId) : null;
  const activeList = activeId ? lists.find(l => l.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}>
      <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {activeCard ? (
          <div className="bg-slate-700 border border-slate-600 rounded-md p-2 text-sm opacity-90 rotate-3 transform scale-105 shadow-lg">
            <p className="font-medium text-white">{activeCard.title}</p>
            {activeCard.description && (
              <p className="text-xs text-gray-300 line-clamp-2">{activeCard.description}</p>)}
          </div>
        ) : activeList ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 w-64 opacity-90 shadow-lg">
            <h2 className="font-medium text-white">{activeList.title}</h2>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
