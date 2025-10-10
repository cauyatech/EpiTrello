"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/lib/cards";
import { CardLabels } from "@/components/card-labels";
import { CardDueDate } from "@/components/card-due-date";

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
      className="bg-slate-700 border border-slate-600 rounded-md p-3 text-sm cursor-grab hover:bg-slate-600 active:cursor-grabbing transition-colors"
    >
      {card.labels && card.labels.length > 0 && (
        <CardLabels labels={card.labels} compact={true} />
      )}
      <p className="font-medium text-white">{card.title}</p>
      {card.description && (
        <p className="text-xs text-gray-300 line-clamp-2 mt-1">{card.description}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        {card.dueDate && (
          <CardDueDate 
            dueDate={card.dueDate} 
            completed={card.completed} 
            compact={true} 
          />
        )}
        {card.completed && !card.dueDate && (
          <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">
            ✓ Done
          </div>
        )}
      </div>
    </div>
  );
}
