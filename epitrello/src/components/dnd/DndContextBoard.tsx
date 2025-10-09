"use client";

import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import {SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove} from "@dnd-kit/sortable";

export function DndContextBoard({
  lists,
  cardsByList,
  onDragEndCard,
  onDragEndList,
  children,
}: {
  lists: any[];
  cardsByList: Record<string, any[]>;
  onDragEndCard: (listId: string, newCards: any[]) => void;
  onDragEndList: (newLists: any[]) => void;
  children: React.ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: {distance: 8,},}));
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Déplacement de listes
    const isActiveList = lists.find(l => l.id === activeId);
    const isOverList = lists.find(l => l.id === overId);
    
    if (isActiveList && isOverList) {
      const oldIndex = lists.findIndex(l => l.id === activeId);
      const newIndex = lists.findIndex(l => l.id === overId);
      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(lists, oldIndex, newIndex);
        onDragEndList(newOrder);
      }
      return;
    }

    // Déplacement de cartes
    const fromListId = Object.keys(cardsByList).find(listId =>
      cardsByList[listId].some(c => c.id === activeId)
    );
    
    if (!fromListId) return;

    const fromCards = cardsByList[fromListId];
    const activeCard = fromCards.find(c => c.id === activeId);
    
    if (!activeCard) return;

    // Déterminer la liste de destination
    let toListId = fromListId;
    let newIndex = fromCards.length;

    // Si on drop sur une carte, on trouve sa liste
    const overCard = Object.keys(cardsByList).find(listId =>
      cardsByList[listId].some(c => c.id === overId)
    );
    
    if (overCard) {
      toListId = overCard;
      const toCards = cardsByList[toListId];
      newIndex = toCards.findIndex(c => c.id === overId);
    }

    const oldIndex = fromCards.findIndex(c => c.id === activeId);

    if (fromListId === toListId) {
      // Réorganisation dans la même liste
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(fromCards, oldIndex, newIndex);
        onDragEndCard(fromListId, reordered);
      }
    } else {
      // Déplacement entre listes
      const updatedFrom = fromCards.filter(c => c.id !== activeId);
      const toCards = cardsByList[toListId];
      const updatedTo = [
        ...toCards.slice(0, newIndex),
        { ...activeCard, listId: toListId },
        ...toCards.slice(newIndex),
      ];
      onDragEndCard(fromListId, updatedFrom);
      onDragEndCard(toListId, updatedTo);
    }
  }

  const activeCard = activeId ? Object.values(cardsByList).flat().find(c => c.id === activeId) : null;
  const activeList = activeId ? lists.find(l => l.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {activeCard ? (
          <div className="bg-neutral-700 rounded-md p-2 text-sm opacity-90 rotate-3 transform scale-105">
            <p className="font-medium">{activeCard.title}</p>
            {activeCard.description && (
              <p className="text-xs text-neutral-300 line-clamp-2">{activeCard.description}</p>
            )}
          </div>
        ) : activeList ? (
          <div className="bg-neutral-800 rounded-xl p-3 w-64 opacity-90">
            <h2 className="font-medium">{activeList.title}</h2>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
