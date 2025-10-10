"use client";

import { useMemo } from "react";
import { Card } from "@/lib/cards";
import { FilterOptions } from "@/components/advanced-filters";

export function useCardFilters(cards: { [listId: string]: Card[] }, filters: FilterOptions) {
  return useMemo(() => {
    const filtered: { [listId: string]: Card[] } = {};

    Object.keys(cards).forEach(listId => {
      filtered[listId] = cards[listId].filter(card => {
        if (filters.labels.length > 0) {
          const hasMatchingLabel = card.labels?.some(label => 
            filters.labels.includes(label.id)
          );
          if (!hasMatchingLabel) return false;
        }
        if (filters.dueDate !== 'none' && card.dueDate) {
          const dueDate = new Date(card.dueDate);
          const now = new Date();
          
          switch (filters.dueDate) {
            case 'overdue':
              if (card.completed || dueDate >= now) return false;
              break;
            case 'today':
              if (!isToday(dueDate)) return false;
              break;
            case 'week':
              if (!isThisWeek(dueDate)) return false;
              break;
            case 'month':
              if (!isThisMonth(dueDate)) return false;
              break;
          }
        } else if (filters.dueDate !== 'none' && !card.dueDate) {
          return false;
        }

        if (filters.completed !== 'all') {
          const isCompleted = card.completed || false;
          if (filters.completed === 'completed' && !isCompleted) return false;
          if (filters.completed === 'incomplete' && isCompleted) return false;
        }
        if (filters.hasDescription !== null) {
          const hasDesc = !!(card.description?.trim());
          if (filters.hasDescription && !hasDesc) return false;
          if (!filters.hasDescription && hasDesc) return false;
        }
        return true;
      });
    });

    return filtered;
  }, [cards, filters]);
}
function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
}

function isThisMonth(date: Date): boolean {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}