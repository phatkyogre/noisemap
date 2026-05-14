import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/feed")({ component: Feed });

type Item = {
  id: string; kind: string; ref_type: string | null; ref_id: string | null;
  payload: Record<string, unknown>; created_at: string; actor_id: string | null;
};

function Feed() {
  const [items, setItems] = useState<Item[]>([]);
  const [actors, setActors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    supabase.from("activity_feed").select("*").order("created_at", { ascending: false }).limit(60).then(({ data }) => {
      if (cancelled) return;
      const list = (data ?? []) as Item[];
      setItems(list);
      const ids = [...new Set(list.map((i) => i.actor_id).filter(Boolean))] as string[];
      if (ids.length) {
        supabase.from("profiles").select("id,username").in("id", ids).then(({ data: p }) => {
          const map: Record<string, string> = {};
          (p ?? []).forEach((x: { id: string; username: string }) => (map[x.id] = x.username));
          setActors(map);
        });
      }
    });
    const ch = supabase.channel("feed-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_feed" }, (p) => {
        setItems((prev) => [p.new as Item, ...prev].slice(0, 80));
      }).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">// scene.feed --tail -f</div>
          <h1 className="text-3xl font-bold uppercase">live activity</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
          <span className="h-2 w-2 bg-primary blink rounded-full" /> realtime
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <div className="text-muted-foreground text-sm py-12 text-center border border-dashed border-border">// quiet on the wire. post a show to start the noise.</div>}
        {items.map((it) => <FeedItem key={it.id} it={it} actor={it.actor_id ? actors[it.actor_id] : undefined} />)}
      </div>
    </div>
  );
}

function FeedItem({ it, actor }: { it: Item; actor?: string }) {
  const ts = formatDistanceToNow(new Date(it.created_at), { addSuffix: true });
  const p = (it.payload || {}) as Record<string, string | undefined>;
  const verb = it.kind === "band_created" ? "spawned a band" : it.kind === "show_created" ? "posted a show" : it.kind;
  const linkTo = it.ref_type === "show" && it.ref_id ? `/shows/${it.ref_id}` : it.ref_type === "band" && p.slug ? `/bands/${p.slug}` : null;
  const inner = (
    <div className="flyer-card p-4 group">
      <div className="flex items-start gap-3">
        <div className="text-primary text-xs mt-0.5">▶</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            <span className="text-primary">@{actor ?? "unknown"}</span> · {verb} · <span className="text-foreground/60">{ts}</span>
          </div>
          <div className="mt-1 font-bold text-sm truncate">
            {String(p.name ?? p.title ?? "")} {p.venue ? <span className="text-muted-foreground">@ {String(p.venue)}</span> : null}
          </div>
          {p.city && <div className="text-xs text-muted-foreground">// {String(p.city)}</div>}
        </div>
      </div>
    </div>
  );
  return linkTo ? <Link to={linkTo}>{inner}</Link> : inner;
}
