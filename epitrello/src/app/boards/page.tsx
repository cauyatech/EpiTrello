"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Board, listBoards, createBoard, renameBoard, deleteBoard } from "@/lib/boards";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/signin";
        return;
      }
      setUid(u.uid);
      await reload(u.uid);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function reload(u: string) {
    const data = await listBoards(u);
    setBoards(data);
  }

  async function handleCreate() {
    if (!uid || !newTitle.trim()) return;
    await createBoard(uid, newTitle.trim());
    setNewTitle("");
    await reload(uid);
  }

  async function handleRename(id: string) {
    const t = prompt("New title?");
    if (!t) return;
    await renameBoard(id, t);
    if (uid) await reload(uid);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this board?")) return;
    await deleteBoard(id);
    if (uid) await reload(uid);
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
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create board</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New board</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <Input placeholder="Board title" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
                <Button onClick={handleCreate}>Create</Button>
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
                <CardTitle className="text-base">{b.title}</CardTitle>
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
