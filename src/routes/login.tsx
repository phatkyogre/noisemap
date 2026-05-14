import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("connection established");
    nav({ to: "/feed" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">// auth.login</div>
      <h1 className="text-3xl font-bold uppercase mb-6">re-enter the network</h1>
      <form onSubmit={submit} className="terminal-frame p-5 pt-7 space-y-4 text-sm">
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ email</div>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-input border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ password</div>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
        </label>
        <button disabled={busy} className="w-full bg-primary text-primary-foreground py-2 uppercase tracking-widest text-xs font-bold hover:bg-primary/80 border-glow disabled:opacity-50">
          {busy ? "connecting..." : "▶ login"}
        </button>
        <div className="text-[10px] text-muted-foreground text-center">
          new here? <Link to="/signup" className="text-primary hover:underline">[ create account ]</Link>
        </div>
      </form>
    </div>
  );
}
