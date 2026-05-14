import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Calendar, MapPin, Plus, Lock } from "lucide-react";

export const Route = createFileRoute("/shows/")({ component: ShowsList });

type Show = { id: string; title: string; venue: string; location: string | null; date_time: string; flyer_url: string | null; is_secret: boolean; venue_type: string | null };

function ShowsList() {
  const { user } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("shows").select("id,title,venue,location,date_time,flyer_url,is_secret,venue_type")
      .gte("date_time", new Date(Date.now() - 86400000).toISOString())
      .order("date_time", { ascending: true })
      .then(({ data }) => setShows((data ?? []) as Show[]));
  }, []);

  const filtered = shows.filter((s) => !q || [s.title, s.venue, s.location].some((x) => (x ?? "").toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">// db.shows --upcoming</div>
          <h1 className="text-3xl font-bold uppercase">incoming shows</h1>
        </div>
        {user && <Link to="/shows/new" className="bg-primary text-primary-foreground px-3 py-2 text-xs uppercase tracking-widest border-glow flex items-center gap-1"><Plus className="h-3 w-3" /> post show</Link>}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="$ grep // title / venue / city"
        className="w-full bg-input border border-border px-3 py-2 mb-6 text-sm font-mono focus:border-primary focus:outline-none" />
      {filtered.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">// no shows scheduled. someone book something.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <Link key={s.id} to="/shows/$id" params={{ id: s.id }} className="flyer-card group overflow-hidden">
              <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                {s.flyer_url ? (
                  <img src={s.flyer_url} alt={s.title} className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100 transition" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-glow">
                    <div className="text-center px-4">
                      <div className="text-[10px] uppercase tracking-widest">// no flyer</div>
                      <div className="text-2xl font-black uppercase mt-2 break-words">{s.title}</div>
                    </div>
                  </div>
                )}
                {s.is_secret && (
                  <div className="absolute top-2 right-2 bg-background/90 border border-primary text-primary px-2 py-1 text-[10px] uppercase flex items-center gap-1"><Lock className="h-3 w-3" /> secret</div>
                )}
              </div>
              <div className="p-3 border-t border-border">
                <div className="font-bold uppercase truncate group-hover:text-primary">{s.title}</div>
                <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1 mt-1"><Calendar className="h-3 w-3" /> {new Date(s.date_time).toLocaleString()}</div>
                <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.venue} {s.location ? `// ${s.location}` : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
