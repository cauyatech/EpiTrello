"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/lib/cards";
import { CardLabels } from "@/components/card-labels";
import { CardDueDate } from "@/components/card-due-date";

interface GlobalSearchProps {
  cards: Card[];
  lists: any[];
  onCardClick: (card: Card) => void;
}

export function GlobalSearch({ cards, lists, onCardClick }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return cards.filter(card => 
      card.title.toLowerCase().includes(query) ||
      card.description?.toLowerCase().includes(query) ||
      card.labels?.some(label => label.name.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [cards, searchQuery]);

  const getListName = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    return list?.title || "Unknown List";
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
          onFocus={() => setIsOpen(searchQuery.trim().length > 0)}
        />
        {isOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
            }}
            className="text-gray-400 hover:text-gray-200 hover:bg-slate-700"
          >
            ✕
          </Button>
        )}
      </div>
      {/* resultats*/}
      {isOpen && filteredCards.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2">
              {filteredCards.length} result{filteredCards.length !== 1 ? 's' : ''} found
            </div>
            <div className="space-y-2">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="p-3 bg-slate-700 rounded-md cursor-pointer hover:bg-slate-600 transition-colors"
                  onClick={() => {
                    onCardClick(card);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{card.title}</h4>
                      <p className="text-xs text-gray-400 mb-2">in {getListName(card.listId)}</p>
                      
                      {card.description && (
                        <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                          {card.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {card.labels && card.labels.length > 0 && (
                          <CardLabels labels={card.labels} compact={true} />
                        )}
                        {card.dueDate && (
                          <CardDueDate 
                            dueDate={card.dueDate} 
                            completed={card.completed} 
                            compact={true} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* rien */}
      {isOpen && searchQuery.trim() !== "" && filteredCards.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          <div className="p-4 text-center text-gray-400">
            No cards found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
}