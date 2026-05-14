import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/shows/new")({ component: NewShow });

function NewShow() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    title: "", venue: "", location: "", lat: "", lng: "",
    date_time: "", lineup: "", notes: "", venue_type: "venue",
  });
  const [secret, setSecret] = useState(false);
  const [flyer, setFlyer] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return <div className="p-16 text-center text-sm text-muted-foreground">login required. <a href="/login" className="text-primary">[login]</a></div>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    let flyer_url: string | null = null;
    if (flyer) {
      const path = `${user!.id}/${Date.now()}-${flyer.name}`;
      const { error: ue } = await supabase.storage.from("flyers").upload(path, flyer);
      if (!ue) flyer_url = supabase.storage.from("flyers").getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await supabase.from("shows").insert({
      creator_id: user!.id,
      title: f.title, venue: f.venue, location: f.location,
      lat: f.lat ? parseFloat(f.lat) : null, lng: f.lng ? parseFloat(f.lng) : null,
      date_time: new Date(f.date_time).toISOString(),
      lineup: f.lineup.split(",").map((s) => s.trim()).filter(Boolean),
      notes: f.notes, flyer_url, is_secret: secret, venue_type: f.venue_type,
    }).select("id").single();
    setBusy(false);
    if (error || !data) return toast.error(error?.message ?? "failed");
    toast.success("show posted");
    nav({ to: "/shows/$id", params: { id: data.id } });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">// shows.create</div>
      <h1 className="text-3xl font-bold uppercase mb-6">post a show</h1>
      <form onSubmit={submit} className="terminal-frame p-5 pt-7 space-y-3 text-sm">
        <Inp label="title" v={f.title} set={(v) => setF({ ...f, title: v })} required />
        <Inp label="venue (name)" v={f.venue} set={(v) => setF({ ...f, venue: v })} required />
        <Inp label="location (city / address)" v={f.location} set={(v) => setF({ ...f, location: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Inp label="lat (optional)" v={f.lat} set={(v) => setF({ ...f, lat: v })} placeholder="40.7128" />
          <Inp label="lng (optional)" v={f.lng} set={(v) => setF({ ...f, lng: v })} placeholder="-74.0060" />
        </div>
        <Inp label="date + time" type="datetime-local" v={f.date_time} set={(v) => setF({ ...f, date_time: v })} required />
        <Inp label="lineup (comma-separated bands)" v={f.lineup} set={(v) => setF({ ...f, lineup: v })} />
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ venue type</div>
          <select value={f.venue_type} onChange={(e) => setF({ ...f, venue_type: e.target.value })}
            className="w-full bg-input border border-border px-3 py-2 font-mono">
            <option value="venue">venue</option>
            <option value="house">house show</option>
            <option value="warehouse">warehouse</option>
            <option value="skatepark">skatepark</option>
            <option value="diy">other DIY space</option>
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ notes</div>
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} placeholder="$5-10 sliding scale, BYOB, no nazis..."
            className="w-full bg-input border border-border px-3 py-2 font-mono" />
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ flyer image</div>
          <input type="file" accept="image/*" onChange={(e) => setFlyer(e.target.files?.[0] ?? null)} className="text-xs" />
        </label>
        <label className="flex items-center gap-2 text-xs uppercase cursor-pointer">
          <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} className="accent-primary" />
          secret show (only logged-in users see address)
        </label>
        <button disabled={busy} className="w-full bg-primary text-primary-foreground py-2 uppercase tracking-widest text-xs font-bold border-glow disabled:opacity-50">
          {busy ? "posting..." : "▶ post show"}
        </button>
      </form>
    </div>
  );
}

function Inp({ label, v, set, ...rest }: { label: string; v: string; set: (v: string) => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">$ {label}</div>
      <input value={v} onChange={(e) => set(e.target.value)} {...rest}
        className="w-full bg-input border border-border px-3 py-2 focus:border-primary focus:outline-none font-mono" />
    </label>
  );
}
