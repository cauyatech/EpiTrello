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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Sign in</h1>
        <div className="space-y-4">
          <Input 
            placeholder="Email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
          />
          <Input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
          />
          <Button 
            onClick={signInEmail} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            Sign in with Email
          </Button>
          <Button 
            variant="outline" 
            onClick={signInGoogle} 
            disabled={loading}
            className="w-full border-slate-600 text-gray-300 hover:bg-slate-700 bg-slate-800"
          >
            Sign in with Google
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-6 text-center">
          No account? <a href="/register" className="text-indigo-400 hover:text-indigo-300 underline">Create one here</a>.
        </p>
      </div>
    </main>
  );
}
