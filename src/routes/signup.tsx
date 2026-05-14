import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[a-z0-9_]{3,20}$/i.test(username)) return toast.error("username: 3-20 chars, letters/numbers/_");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        data: { username, display_name: username },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("welcome to the underground");
    nav({ to: "/feed" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">// auth.register</div>
      <h1 className="text-3xl font-bold uppercase mb-6">join the scene</h1>
      <form onSubmit={submit} className="terminal-frame p-5 pt-7 space-y-4 text-sm">
        {[
          { l: "handle", v: username, set: setUsername, type: "text", ph: "your_handle" },
          { l: "email", v: email, set: setEmail, type: "email", ph: "you@scene.local" },
          { l: "password", v: password, set: setPassword, type: "password", ph: "min 8 chars" },
        ].map((f) => (
          <label key={f.l} className="block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ {f.l}</div>
            <input required type={f.type} value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
              className="w-full bg-input border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder:text-muted-foreground/40" />
          </label>
        ))}
        <button disabled={busy} className="w-full bg-primary text-primary-foreground py-2 uppercase tracking-widest text-xs font-bold hover:bg-primary/80 border-glow disabled:opacity-50">
          {busy ? "spawning..." : "▶ sign up"}
        </button>
        <div className="text-[10px] text-muted-foreground text-center">
          existing? <Link to="/login" className="text-primary hover:underline">[ login ]</Link>
        </div>
      </form>
    </div>
  );
}
