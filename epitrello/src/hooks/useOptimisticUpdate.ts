"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface OptimisticAction<T> {
  optimisticUpdate: () => void;
  serverUpdate: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  rollback: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdate() {
  const [isLoading, setIsLoading] = useState(false);

  const executeOptimistic = useCallback(async <T>({
    optimisticUpdate,
    serverUpdate,
    onSuccess,
    onError,
    rollback,
    successMessage,
    errorMessage
  }: OptimisticAction<T>) => {
    setIsLoading(true);
    
    // Apply optimistic update immediately
    optimisticUpdate();
    
    try {
      const result = await serverUpdate();
      if (onSuccess) {
        onSuccess(result);
      }
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error) {
      rollback();
      
      const errorObj = error as Error;
      console.error("Optimistic update failed:", errorObj);
      if (onError) {
        onError(errorObj);
      }
      toast.error(errorMessage || errorObj.message || "Operation failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { executeOptimistic, isLoading };
}
