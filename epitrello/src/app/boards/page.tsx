"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { createBoard, renameBoard, deleteBoard } from "@/lib/boards";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeBoards } from "@/hooks/useRealtimeBoards";
import { toast } from "sonner";
import Link from "next/link";

export default function BoardsPage() {
  const { user, loading: authLoading } = useAuth("/signin");
  const { boards, loading: boardsLoading, error } = useRealtimeBoards(user?.uid || null);
  const [newTitle, setNewTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loading = authLoading || boardsLoading;

  async function handleCreate() {
    if (!user?.uid || !newTitle.trim()) return;
    try {
      await createBoard(user.uid, newTitle.trim());
      setNewTitle("");
      setDialogOpen(false);
      toast.success("Board created successfully");
    } catch (error) {
      console.error("Error creating board:", error);
      toast.error("Failed to create board");
    }
  }

  async function handleRename(id: string) {
    const t = prompt("New title?");
    if (!t?.trim()) return;
    try {
      await renameBoard(id, t.trim());
      toast.success("Board renamed successfully");
    } catch (error) {
      console.error("Error renaming board:", error);
      toast.error("Failed to rename board");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this board?")) return;
    try {
      await deleteBoard(id);
      toast.success("Board deleted successfully");
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Failed to delete board");
    }
  }

  if (error) {
    toast.error("Error loading boards: " + error);
  }

  if (loading) {
    return (
      <div className="grid gap-3 pt-10">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <main className="pt-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Boards</h1>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create board</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New board</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <Input 
                  placeholder="Board title" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTitle.trim()) {
                      handleCreate();
                    }
                  }}
                />
                <Button onClick={handleCreate} disabled={!newTitle.trim()}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" onClick={() => signOut(auth)}>Sign out</Button>
        </div>
      </div>

      {boards.length === 0 ? (
        <p className="text-neutral-400">No boards yet. Create your first one.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {boards.map(b => (
            <Card key={b.id} className="p-3">
              <CardHeader className="p-0 flex flex-row items-center justify-between">
                <Link href={`/b/${b.id}`} className="text-base font-medium hover:underline">
                  {b.title}
                </Link>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleRename(b.id)}>Rename</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>Delete</Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
