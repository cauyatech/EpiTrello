"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
  confirm: z.string(),
  displayName: z.string().max(50).optional(),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirm: "", displayName: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[k:string]: string}>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: {[k:string]: string} = {};
      parsed.error.issues.forEach(i => { map[i.path[0] as string] = i.message; });
      setErrors(map);
      toast.error("Please fix form errors.");
      return;
    }
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);

      if (form.displayName?.trim()) {
        await updateProfile(cred.user, { displayName: form.displayName.trim() });
      }
      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email,
        displayName: cred.user.displayName ?? form.displayName?.trim() ?? "",
        createdAt: serverTimestamp(),
        provider: "password",
      });
      toast.success("Account created!");
      router.push("/boards");
    } catch (err: any) {
      const msg = mapFirebaseAuthError(err?.code) ?? err?.message ?? "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Create your account</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              value={form.email}
              onChange={(e)=>setForm({...form, email: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            />
            {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-gray-300">Pseudonyme (optional)</Label>
            <Input 
              id="displayName" 
              value={form.displayName}
              onChange={(e)=>setForm({...form, displayName: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            />
            {errors.displayName && <p className="text-sm text-red-400">{errors.displayName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={form.password}
              onChange={(e)=>setForm({...form, password: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            />
            {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-gray-300">Confirm password</Label>
            <Input 
              id="confirm" 
              type="password" 
              value={form.confirm}
              onChange={(e)=>setForm({...form, confirm: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            />
            {errors.confirm && <p className="text-sm text-red-400">{errors.confirm}</p>}
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            {loading ? "Creating account…" : "Sign up"}
          </Button>

          <p className="text-sm text-gray-400 text-center">
            Already have an account?{" "}
            <a className="text-indigo-400 hover:text-indigo-300 underline" href="/signin">Sign in</a>
          </p>
        </form>
      </div>
    </main>
  );
}

function mapFirebaseAuthError(code?: string): string | undefined {
  switch (code) {
    case "auth/email-already-in-use": return "This email is already in use.";
    case "auth/invalid-email": return "Invalid email.";
    case "auth/weak-password": return "Password is too weak.";
    case "auth/operation-not-allowed": return "Registration is disabled for this project.";
    default: return undefined;
  }
}
