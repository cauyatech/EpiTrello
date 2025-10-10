"use client";

interface CardDueDateProps {
  dueDate?: any; // Can be Date, Firestore Timestamp, or string
  completed?: boolean;
  compact?: boolean;
}

export function CardDueDate({ dueDate, completed = false, compact = false }: CardDueDateProps) {
  if (!dueDate) return null;

  // Convert dueDate to Date object
  const dateObj = toDate(dueDate);
  if (!dateObj) return null;

  const now = new Date();
  const isOverdue = !completed && dateObj < now;
  const isDueToday = isToday(dateObj);
  const isDueSoon = !completed && dateObj > now && dateObj < addDays(now, 3);

  const getStatusColor = () => {
    if (completed) return "bg-green-100 text-green-800 border-green-200";
    if (isOverdue) return "bg-red-100 text-red-800 border-red-200";
    if (isDueToday) return "bg-orange-100 text-orange-800 border-orange-200";
    if (isDueSoon) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getIcon = () => {
    if (completed) return "✓";
    if (isOverdue) return "⚠";
    if (isDueToday) return "🔥";
    return "📅";
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return "Today";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper functions
  function toDate(value: any): Date | null {
    if (!value) return null;
    
    // If it's already a Date object
    if (value instanceof Date) {
      return value;
    }
    
    // If it's a Firestore Timestamp
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    
    // If it's a string or number, try to parse it
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor()} ${
      compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
    }`}>
      <span>{getIcon()}</span>
      <span>{formatDate(dateObj)}</span>
      {completed && <span className="font-bold">✓</span>}
    </div>
  );
}
