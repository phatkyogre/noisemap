import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Skull, Radio, Map as MapIcon, Calendar, Users, Shield, LogOut, Search } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/feed", label: "FEED", icon: Radio },
  { to: "/shows", label: "SHOWS", icon: Calendar },
  { to: "/bands", label: "BANDS", icon: Users },
  { to: "/map", label: "MAP", icon: MapIcon },
];

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-3 text-xs uppercase tracking-widest">
        <Link to="/" className="flex items-center gap-2 text-primary text-glow font-bold">
          <Skull className="h-4 w-4" />
          <span>NOISEMAP</span>
          <span className="hidden sm:inline text-muted-foreground font-normal">/ scene.local</span>
        </Link>
        <nav className="ml-4 hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = path.startsWith(l.to);
            const Icon = l.icon;
            return (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-1.5 px-2.5 py-1 border ${active ? "border-primary text-primary text-glow bg-primary/10" : "border-transparent text-muted-foreground hover:text-primary hover:border-primary/40"}`}>
                <Icon className="h-3 w-3" />{l.label}
              </Link>
            );
          })}
          <Link to="/search" className="flex items-center gap-1.5 px-2.5 py-1 border border-transparent text-muted-foreground hover:text-primary hover:border-primary/40">
            <Search className="h-3 w-3" />SEARCH
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin" className="hidden sm:flex items-center gap-1 px-2 py-1 border border-primary/60 text-primary">
              <Shield className="h-3 w-3" />ADMIN
            </Link>
          )}
          {user ? (
            <>
              <Link to="/shows/new" className="hidden sm:inline-block bg-primary text-primary-foreground px-3 py-1 hover:bg-primary/80 border border-primary">+ POST SHOW</Link>
              <button onClick={() => signOut()} className="text-muted-foreground hover:text-primary p-1" aria-label="logout"><LogOut className="h-4 w-4" /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-muted-foreground hover:text-primary">[LOGIN]</Link>
              <Link to="/signup" className="bg-primary text-primary-foreground px-3 py-1 hover:bg-primary/80 border border-primary">JOIN</Link>
            </>
          )}
          <button className="md:hidden text-primary" onClick={() => setOpen(!open)}>≡</button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-3 py-2 text-xs uppercase">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2 border-b border-border/50 text-muted-foreground hover:text-primary">
              {l.label}
            </Link>
          ))}
          <Link to="/search" onClick={() => setOpen(false)} className="block py-2 border-b border-border/50">SEARCH</Link>
          {user && <Link to="/shows/new" onClick={() => setOpen(false)} className="block py-2 text-primary">+ POST SHOW</Link>}
          {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="block py-2 text-primary">ADMIN</Link>}
        </div>
      )}
    </header>
  );
}
