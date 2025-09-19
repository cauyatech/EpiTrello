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
    <main className="max-w-sm mx-auto pt-24">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>

      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={form.email}
            onChange={(e)=>setForm({...form, email: e.target.value})} />
          {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="displayName">Pseudonyme (optional)</Label>
          <Input id="displayName" value={form.displayName}
            onChange={(e)=>setForm({...form, displayName: e.target.value})} />
          {errors.displayName && <p className="text-sm text-red-400">{errors.displayName}</p>}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={form.password}
            onChange={(e)=>setForm({...form, password: e.target.value})} />
          {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" value={form.confirm}
            onChange={(e)=>setForm({...form, confirm: e.target.value})} />
          {errors.confirm && <p className="text-sm text-red-400">{errors.confirm}</p>}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </Button>

        <p className="text-sm text-neutral-400">
          Already have an account?{" "}
          <a className="underline" href="/signin">Sign in</a>
        </p>
      </form>
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
