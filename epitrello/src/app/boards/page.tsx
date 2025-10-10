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
import { useBoards } from "@/hooks/useBoards";
import { toast } from "sonner";
import Link from "next/link";

export default function BoardsPage() {
  const { user, loading: authLoading } = useAuth("/signin");
  const { boards, loading: boardsLoading, error, refetch } = useBoards(user?.uid || null);
  const [newTitle, setNewTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loading = authLoading || boardsLoading;

  async function handleCreate() {
    if (!user?.uid || !newTitle.trim()) return;
    try {
      await createBoard(user.uid, newTitle.trim());
      setNewTitle("");
      setDialogOpen(false);
      await refetch();
      toast.success("Board created successfully");    } catch (error) {
      console.error("Error creating board:", error);
      toast.error("Failed to create board");
    }
  }

  async function handleRename(id: string) {
    const t = prompt("New title?");
    if (!t?.trim()) return;
    try {
      await renameBoard(id, t.trim());
      await refetch();
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
      await refetch();
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
      <div className="min-h-screen p-6">
        <div className="grid gap-3 pt-10">
          <Skeleton className="h-8 w-40 bg-slate-700" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 bg-slate-700" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📋 My Boards</h1>
            <p className="text-gray-300">Organize your projects and tasks</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                await signOut(auth);
                window.location.href = '/signin';
              }}
              variant="outline"
              className="text-red-400 border-red-400 hover:bg-red-500/20 bg-slate-800 hover:text-red-300"
            >
              🚪 Logout
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  ➕ Create Board
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">📋 Create New Board</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Board Name
                  </label>
                  <Input 
                    placeholder="Enter board name..." 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newTitle.trim()) {
                        handleCreate();
                      }
                    }}
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleCreate} 
                    disabled={!newTitle.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1 font-medium"
                  >
                    ✨ Create Board
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700 bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-white mb-2">No boards yet</h2>
          <p className="text-gray-300 mb-6">Create your first board to get started organizing your tasks</p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            ➕ Create Your First Board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map(b => (
            <Card key={b.id} className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-slate-750">
              <CardHeader className="p-6">
                <div className="flex items-start justify-between">
                  <Link href={`/b/${b.id}`} className="flex-1">
                    <CardTitle className="text-xl font-bold text-white hover:text-indigo-400 transition-colors cursor-pointer">
                      {b.title}
                    </CardTitle>
                    <p className="text-gray-400 text-sm mt-2">Click to open board</p>
                  </Link>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleRename(b.id)}
                    className="text-indigo-400 border-indigo-400 hover:bg-indigo-500/20 bg-slate-700 hover:text-indigo-300"
                  >
                    ✏️ Rename
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(b.id)}
                    className="text-red-400 border-red-400 hover:bg-red-500/20 bg-slate-700 hover:text-red-300"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      </main>
    </div>
  );
}
