"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/lib/cards";

export function SortableCard({ card }: { card: Card }) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ 
    id: card.id,
    data: {
      type: "card",
      card,
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-neutral-700 rounded-md p-2 text-sm cursor-grab hover:bg-neutral-600 active:cursor-grabbing"
    >
      <p className="font-medium">{card.title}</p>
      {card.description && (
        <p className="text-xs text-neutral-300 line-clamp-2">{card.description}</p>
      )}
    </div>
  );
}
