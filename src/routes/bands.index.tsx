import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/bands/")({ component: BandsList });

type Band = { id: string; name: string; slug: string; genre: string | null; city: string | null; tags: string[] | null; image_url: string | null };

function BandsList() {
  const { user } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("bands").select("id,name,slug,genre,city,tags,image_url").order("created_at", { ascending: false }).then(({ data }) => setBands((data ?? []) as Band[]));
  }, []);

  const filtered = bands.filter((b) =>
    !q || [b.name, b.genre, b.city, ...(b.tags ?? [])].some((s) => (s ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">// db.bands</div>
          <h1 className="text-3xl font-bold uppercase">the roster</h1>
        </div>
        {user && <Link to="/bands/new" className="bg-primary text-primary-foreground px-3 py-2 text-xs uppercase tracking-widest border-glow flex items-center gap-1"><Plus className="h-3 w-3" /> add band</Link>}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="$ grep // name / genre / city / tag"
        className="w-full bg-input border border-border px-3 py-2 mb-6 text-sm font-mono focus:border-primary focus:outline-none" />

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">// no bands yet. be the first.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((b) => (
            <Link key={b.id} to="/bands/$slug" params={{ slug: b.slug }} className="flyer-card p-4 group">
              <div className="flex items-start gap-3">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.name} className="h-14 w-14 object-cover border border-border" />
                ) : (
                  <div className="h-14 w-14 border border-border bg-muted flex items-center justify-center text-primary font-black text-lg">
                    {b.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold uppercase truncate group-hover:text-primary">{b.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{b.genre ?? "—"} // {b.city ?? "—"}</div>
                  {b.tags && b.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {b.tags.slice(0, 3).map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground">#{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
