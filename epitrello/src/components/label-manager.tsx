"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label, LABEL_COLORS, createLabel } from "@/lib/labels";
import { Card, updateCard } from "@/lib/cards";
import { toast } from "sonner";

interface LabelManagerProps {
  card: Card;
  availableLabels: Label[];
  boardId: string;
  onLabelsChange: () => void;
}

export function LabelManager({ card, availableLabels, boardId, onLabelsChange }: LabelManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);
  const [isCreating, setIsCreating] = useState(false);

  if (!card) {
    return null;
  }

  const cardLabelIds = card.labels?.map(l => l.id) || [];

  const handleToggleLabel = async (label: Label) => {
    if (!card) return;
    
    const currentLabels = card.labels || [];
    const isLabelAttached = currentLabels.some(l => l.id === label.id);
    
    let newLabels;
    if (isLabelAttached) {
      newLabels = currentLabels.filter(l => l.id !== label.id);
    } else {
      newLabels = [...currentLabels, { id: label.id, name: label.name, color: label.color }];
    }

    try {
      await updateCard(card.id, { labels: newLabels });
      onLabelsChange();
      toast.success(isLabelAttached ? "Label removed" : "Label added");
    } catch (error) {
      console.error("Error updating card labels:", error);
      toast.error("Failed to update labels");
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    
    setIsCreating(true);
    try {
      await createLabel(boardId, newLabelName.trim(), selectedColor);
      setNewLabelName("");
      setSelectedColor(LABEL_COLORS[0].value);
      toast.success("Label created");
    } catch (error) {
      console.error("Error creating label:", error);
      toast.error("Failed to create label");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
          Labels
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white text-black max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* etikete dispo */}
          <div>
            <h4 className="text-sm font-medium mb-2">Available Labels</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableLabels.map((label) => {
                const isAttached = card ? cardLabelIds.includes(label.id) : false;
                return (
                  <div
                    key={label.id}
                    className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                      isAttached 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleToggleLabel(label)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm">{label.name}</span>
                    </div>
                    {isAttached && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>)}
                  </div>);})}
            </div>
          </div>

          {/* faire une nouvelle */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Create New Label</h4>
            <div className="space-y-3">
              <Input
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="text-black"/>
              {/* mettre sa couleur */}
              <div>
                <p className="text-xs text-gray-600 mb-2">Choose color:</p>
                <div className="flex flex-wrap gap-2">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-6 h-6 rounded-full border-2 ${
                        selectedColor === color.value 
                          ? 'border-gray-800 scale-110' 
                          : 'border-gray-300'
                      } transition-all`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}/>))}
                </div>
              </div>

              <Button
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim() || isCreating}
                size="sm"
                className="w-full">
                {isCreating ? "Creating..." : "Create Label"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}