"use client";

import { Button } from "@/components/ui/button";
import { createLabel } from "@/lib/labels";
import { toast } from "sonner";

interface QuickLabelsProps {
  boardId: string;
}

const QUICK_LABELS = [
  { name: "Important", color: "#ef4444" },
  { name: "In Progress", color: "#eab308" },
  { name: "Done", color: "#22c55e" },
  { name: "Do not Forget", color: "#f97316" },
  { name: "Low priority", color: "#3b82f6" },
];

export function QuickLabels({ boardId }: QuickLabelsProps) {
  const handleCreateQuickLabels = async () => {
    try {
      for (const label of QUICK_LABELS) {
        await createLabel(boardId, label.name, label.color);
      }
      toast.success("Quick labels created!");
    } catch (error) {
      console.error("Error creating quick labels:", error);
      toast.error("Failed to create quick labels");
    }
  };

  return (
    <div className="mb-4 p-3 bg-neutral-800 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Quick Setup</h3>
      <p className="text-xs text-neutral-400 mb-3">
        Create common labels for your board
      </p>
      <Button 
        onClick={handleCreateQuickLabels} 
        size="sm" 
        variant="outline"
        className="w-full"
      >
        Create Quick Labels
      </Button>
      <div className="flex flex-wrap gap-1 mt-2">
        {QUICK_LABELS.map((label) => (
          <span
            key={label.name}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </span>
        ))}
      </div>
    </div>
  );
}
