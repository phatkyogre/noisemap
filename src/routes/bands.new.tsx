import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/bands/new")({ component: NewBand });

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

function NewBand() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", bio: "", genre: "", city: "", tags: "", links: "" });
  const [busy, setBusy] = useState(false);
  const [imgFile, setImgFile] = useState<File | null>(null);

  if (!user) return <Gate />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const slug = slugify(f.name) + "-" + Math.random().toString(36).slice(2, 6);
    let image_url: string | null = null;
    if (imgFile) {
      const path = `${user!.id}/${slug}-${Date.now()}.${imgFile.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("band-images").upload(path, imgFile);
      if (!upErr) image_url = supabase.storage.from("band-images").getPublicUrl(path).data.publicUrl;
    }
    const links: Record<string, string> = {};
    f.links.split("\n").map((l) => l.trim()).filter(Boolean).forEach((l, i) => (links[`link_${i}`] = l));
    const { error } = await supabase.from("bands").insert({
      owner_id: user!.id, name: f.name, slug, bio: f.bio, genre: f.genre, city: f.city,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      links, image_url,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("band spawned");
    nav({ to: "/bands/$slug", params: { slug } });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">// bands.create</div>
      <h1 className="text-3xl font-bold uppercase mb-6">spawn a band</h1>
      <form onSubmit={submit} className="terminal-frame p-5 pt-7 space-y-3 text-sm">
        <Field label="name" v={f.name} set={(v) => setF({ ...f, name: v })} required />
        <Field label="genre" v={f.genre} set={(v) => setF({ ...f, genre: v })} placeholder="hardcore / crust / d-beat / powerviolence" />
        <Field label="city" v={f.city} set={(v) => setF({ ...f, city: v })} />
        <Field label="tags (comma-separated)" v={f.tags} set={(v) => setF({ ...f, tags: v })} placeholder="diy, basement, anti-fa" />
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ bio</div>
          <textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} rows={4}
            className="w-full bg-input border border-border px-3 py-2 focus:border-primary focus:outline-none font-mono" />
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ links (one per line)</div>
          <textarea value={f.links} onChange={(e) => setF({ ...f, links: e.target.value })} rows={3} placeholder="https://bandcamp.com/..."
            className="w-full bg-input border border-border px-3 py-2 focus:border-primary focus:outline-none font-mono" />
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ image (optional)</div>
          <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files?.[0] ?? null)} className="text-xs" />
        </label>
        <button disabled={busy || !f.name} className="w-full bg-primary text-primary-foreground py-2 uppercase tracking-widest text-xs font-bold border-glow disabled:opacity-50">
          {busy ? "uploading..." : "▶ create band"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, v, set, ...rest }: { label: string; v: string; set: (v: string) => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ {label}</div>
      <input value={v} onChange={(e) => set(e.target.value)} {...rest}
        className="w-full bg-input border border-border px-3 py-2 focus:border-primary focus:outline-none font-mono" />
    </label>
  );
}

function Gate() {
  return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">login required. <a href="/login" className="text-primary">[login]</a></div>;
}
