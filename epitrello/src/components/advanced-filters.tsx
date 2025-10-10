"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/lib/labels";

export interface FilterOptions {
  labels: string[];
  dueDate: 'none' | 'overdue' | 'today' | 'week' | 'month';
  completed: 'all' | 'completed' | 'incomplete';
  assignedTo: string[];
  hasDescription: boolean | null;
}

interface AdvancedFiltersProps {
  labels: Label[];
  currentFilters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function AdvancedFilters({ labels, currentFilters, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...currentFilters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      labels: [],
      dueDate: 'none',
      completed: 'all',
      assignedTo: [],
      hasDescription: null
    });
  };

  const hasActiveFilters = 
    currentFilters.labels.length > 0 ||
    currentFilters.dueDate !== 'none' ||
    currentFilters.completed !== 'all' ||
    currentFilters.assignedTo.length > 0 ||
    currentFilters.hasDescription !== null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={`text-gray-300 border-slate-600 hover:bg-slate-700 bg-slate-800 ${
            hasActiveFilters ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : ''
          }`}
        >
          Advanced Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-400 hover:text-gray-200 hover:bg-slate-700"
          >
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
          {/* Labels Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-200">Labels</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {labels.map((label) => {
                const isSelected = currentFilters.labels.includes(label.id);
                return (
                  <button
                    key={label.id}
                    className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors text-white ${
                      isSelected 
                        ? 'bg-slate-600 border border-slate-500' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => {
                      const newLabels = isSelected
                        ? currentFilters.labels.filter(id => id !== label.id)
                        : [...currentFilters.labels, label.id];
                      updateFilter('labels', newLabels);
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-white truncate">{label.name}</span>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-200">Due Date</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'none', label: 'Any' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'today', label: 'Due Today' },
                { value: 'week', label: 'Due This Week' },
                { value: 'month', label: 'Due This Month' }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={currentFilters.dueDate === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('dueDate', option.value)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Completion Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-200">Status</h4>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Cards' },
                { value: 'completed', label: 'Completed' },
                { value: 'incomplete', label: 'Incomplete' }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={currentFilters.completed === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('completed', option.value)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Other Filters */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-200">Other</h4>
            <div className="flex gap-2">
              <Button
                variant={currentFilters.hasDescription === true ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('hasDescription', 
                  currentFilters.hasDescription === true ? null : true
                )}
                className="text-xs"
              >
                Has Description
              </Button>
              <Button
                variant={currentFilters.hasDescription === false ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('hasDescription', 
                  currentFilters.hasDescription === false ? null : false
                )}
                className="text-xs"
              >
                No Description
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getActiveFilterCount(): number {
    let count = 0;
    if (currentFilters.labels.length > 0) count++;
    if (currentFilters.dueDate !== 'none') count++;
    if (currentFilters.completed !== 'all') count++;
    if (currentFilters.assignedTo.length > 0) count++;
    if (currentFilters.hasDescription !== null) count++;
    return count;
  }
}