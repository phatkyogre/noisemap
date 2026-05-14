import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({ component: SearchPage });

function SearchPage() {
  const [q, setQ] = useState("");
  const [bands, setBands] = useState<{ id: string; name: string; slug: string; genre: string | null; city: string | null }[]>([]);
  const [shows, setShows] = useState<{ id: string; title: string; venue: string; date_time: string }[]>([]);

  useEffect(() => {
    if (!q.trim()) { setBands([]); setShows([]); return; }
    const t = setTimeout(async () => {
      const term = `%${q}%`;
      const [b, s] = await Promise.all([
        supabase.from("bands").select("id,name,slug,genre,city").or(`name.ilike.${term},genre.ilike.${term},city.ilike.${term}`).limit(20),
        supabase.from("shows").select("id,title,venue,date_time").or(`title.ilike.${term},venue.ilike.${term},location.ilike.${term}`).limit(20),
      ]);
      setBands((b.data ?? []) as typeof bands);
      setShows((s.data ?? []) as typeof shows);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">// search.all</div>
      <h1 className="text-3xl font-bold uppercase mb-4">grep the network</h1>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="$ search bands / shows / cities / genres / tags..."
        className="w-full bg-input border border-border px-3 py-3 mb-6 text-sm font-mono focus:border-primary focus:outline-none border-glow" />

      <Section title={`// bands [${bands.length}]`}>
        {bands.map((b) => (
          <Link key={b.id} to="/bands/$slug" params={{ slug: b.slug }} className="block border border-border p-2 hover:border-primary text-sm">
            <span className="font-bold">{b.name}</span> <span className="text-muted-foreground text-xs">// {b.genre ?? "—"} · {b.city ?? "—"}</span>
          </Link>
        ))}
      </Section>
      <Section title={`// shows [${shows.length}]`}>
        {shows.map((s) => (
          <Link key={s.id} to="/shows/$id" params={{ id: s.id }} className="block border border-border p-2 hover:border-primary text-sm">
            <span className="font-bold">{s.title}</span> <span className="text-muted-foreground text-xs">// {s.venue} · {new Date(s.date_time).toLocaleDateString()}</span>
          </Link>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
