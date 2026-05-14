import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/map")({ component: MapPage, ssr: false });

type Show = { id: string; title: string; venue: string; lat: number; lng: number; date_time: string; venue_type: string | null; is_secret: boolean };

function MapPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [Comp, setComp] = useState<null | typeof import("@/components/SceneMap")>(null);

  useEffect(() => {
    supabase.from("shows").select("id,title,venue,lat,lng,date_time,venue_type,is_secret")
      .not("lat", "is", null).not("lng", "is", null)
      .gte("date_time", new Date(Date.now() - 86400000).toISOString())
      .then(({ data }) => setShows(((data ?? []) as Show[]).filter(s => s.lat && s.lng)));
    import("@/components/SceneMap").then(setComp);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">// map.scene --live</div>
      <h1 className="text-3xl font-bold uppercase mb-4">scene map</h1>
      <div className="text-xs text-muted-foreground mb-4">// markers: ▲ venue · ● house · ■ warehouse · ◆ skatepark · ✕ DIY</div>
      <div className="terminal-frame pt-7 overflow-hidden">
        <div className="h-[calc(100vh-260px)] min-h-[420px] relative">
          {Comp ? <Comp.default shows={shows} /> : <div className="p-8 text-muted-foreground text-sm">// loading map...</div>}
        </div>
      </div>
      {shows.length === 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          // no geocoded shows yet. <Link to="/shows/new" className="text-primary">[ post one with lat/lng ]</Link>
        </div>
      )}
    </div>
  );
}
