"use client";

import { CardLabel } from "@/lib/cards";

interface CardLabelsProps {
  labels: CardLabel[];
  compact?: boolean;
}

export function CardLabels({ labels, compact = false }: CardLabelsProps) {
  if (!labels || labels.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'mb-1' : 'mb-2'}`}>
      {labels.map((label) => (
        <span
          key={label.id}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'
          }`}
          style={{
            backgroundColor: label.color,
            color: getTextColor(label.color)
          }}
          title={label.name}
        >
          {compact ? (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: label.color }}
            />
          ) : (
            label.name
          )}
        </span>
      ))}
    </div>
  );
}

// Fonction pour déterminer la couleur du texte basée sur la couleur de fond
function getTextColor(backgroundColor: string): string {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}