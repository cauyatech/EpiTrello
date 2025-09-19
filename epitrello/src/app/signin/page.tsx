"use client";

import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInEmail() {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/boards");
    } catch (e:any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function signInGoogle() {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.push("/boards");
    } catch (e:any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid gap-4 max-w-sm mx-auto pt-24">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <Input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <Input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <Button onClick={signInEmail} disabled={loading}>Sign in with Email</Button>
      <Button variant="secondary" onClick={signInGoogle} disabled={loading}>Sign in with Google</Button>
      <p className="text-sm text-neutral-400">
        No account? <a href="/register" className="underline">Create your here</a>.
      </p>
    </main>
  );
}
