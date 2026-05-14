import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skull, Radio, Map as MapIcon, Calendar, Flame } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

const SCROLL_TICKER = ["// no cover", "// all ages", "// DIY or die", "// fuck the algorithm", "// scene report incoming", "// burn it down", "// basement shows only", "// crust never sleeps"];

function Landing() {
  const [stats, setStats] = useState({ shows: 0, bands: 0, scenes: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from("shows").select("id", { count: "exact", head: true }),
      supabase.from("bands").select("id", { count: "exact", head: true }),
      supabase.from("shows").select("location"),
    ]).then(([s, b, locs]) => {
      const cities = new Set((locs.data ?? []).map((x: { location: string | null }) => x.location).filter(Boolean));
      setStats({ shows: s.count ?? 0, bands: b.count ?? 0, scenes: cities.size });
    });
  }, []);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="scanlines absolute inset-0 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-32 relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary">
            <span className="blink">█</span> connection.established // node:0x{(Math.random()*0xffff|0).toString(16).padStart(4,'0')}
          </div>
          <h1 className="mt-6 text-5xl sm:text-7xl md:text-8xl font-black uppercase leading-[0.9] tracking-tight">
            <span className="block">NOISE</span>
            <span className="block text-primary text-glow">/MAP/</span>
            <span className="block text-muted-foreground text-2xl sm:text-3xl mt-3 font-mono normal-case tracking-normal">
              the underground network for DIY shows, bands & scenes that{" "}
              <span className="text-primary line-through">don't exist on Spotify</span>
            </span>
          </h1>
          <div className="mt-10 flex flex-wrap gap-3 text-xs uppercase tracking-widest">
            <Link to="/feed" className="bg-primary text-primary-foreground px-5 py-3 border border-primary hover:bg-primary/80 border-glow font-bold">
              ▶ enter the feed
            </Link>
            <Link to="/shows" className="border border-border px-5 py-3 hover:border-primary hover:text-primary">
              find shows tonight
            </Link>
            <Link to="/signup" className="border border-border px-5 py-3 hover:border-primary hover:text-primary">
              [+] join the scene
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-2 max-w-2xl">
            {[
              { n: stats.shows, l: "shows posted" },
              { n: stats.bands, l: "bands listed" },
              { n: stats.scenes, l: "active cities" },
            ].map((s, i) => (
              <div key={i} className="terminal-frame pt-6 pb-3 px-3">
                <div className="text-3xl font-bold text-primary text-glow">{String(s.n).padStart(3, "0")}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-widest">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* marquee */}
        <div className="border-y border-primary/30 bg-primary/5 py-2 marquee text-primary text-xs uppercase tracking-widest">
          <div>
            {[...SCROLL_TICKER, ...SCROLL_TICKER].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-6">// what's on the wire</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Calendar, t: "POST A SHOW", d: "Basements, warehouses, skateparks, secret addresses. Mark it secret if it's invite-only.", to: "/shows/new" },
            { icon: Skull, t: "BAND PAGES", d: "Bio, demo audio, merch, upcoming shows, comments. Your zine page on the network.", to: "/bands" },
            { icon: MapIcon, t: "SCENE MAP", d: "Live map of every venue, house, & DIY space across the network.", to: "/map" },
            { icon: Radio, t: "LIVE FEED + CHAT", d: "Real-time scene activity. Per-show chat rooms. Talk during the set.", to: "/feed" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.t} to={f.to} className="flyer-card p-5 group block relative">
                <Icon className="h-6 w-6 text-primary mb-3 group-hover:text-glow" />
                <div className="font-bold uppercase text-sm tracking-wider">{f.t}</div>
                <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.d}</div>
                <div className="mt-3 text-[10px] text-primary opacity-0 group-hover:opacity-100">[ enter ⏎ ]</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Manifesto */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-8">
          <div>
            <Flame className="h-6 w-6 text-primary mb-3" />
            <h2 className="text-3xl font-bold uppercase tracking-tight">no algorithms. no ads. no labels.</h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Built by + for the people running the shows. No engagement metrics. No "discover weekly." If you want to find what's playing in a basement four blocks over tonight — this is where it lives.
            </p>
          </div>
          <div className="terminal-frame p-4 pt-7 text-xs text-muted-foreground space-y-1 font-mono">
            <div><span className="text-primary">$</span> noisemap --status</div>
            <div>→ scene: <span className="text-primary">ALIVE</span></div>
            <div>→ uptime: 24/7/365</div>
            <div>→ moderation: community + admin</div>
            <div>→ tracking: <span className="text-primary">ZERO</span></div>
            <div>→ vibe: <span className="text-primary">crust / hardcore / d-beat / powerviolence / emoviolence</span></div>
            <div>$ <span className="blink">█</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
