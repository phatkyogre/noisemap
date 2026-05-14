import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Flag } from "lucide-react";

export const Route = createFileRoute("/bands/$slug")({ component: BandPage });

type Band = { id: string; name: string; slug: string; bio: string | null; genre: string | null; city: string | null; tags: string[] | null; links: Record<string, string> | null; image_url: string | null; owner_id: string };
type Demo = { id: string; title: string; audio_url: string };
type Show = { id: string; title: string; venue: string; date_time: string };
type Comment = { id: string; user_id: string; body: string; created_at: string };

function BandPage() {
  const { slug } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const [band, setBand] = useState<Band | null>(null);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [newDemoTitle, setNewDemoTitle] = useState("");
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [bandImageUploading, setBandImageUploading] = useState(false);
  const [notFoundFlag, setNF] = useState(false);
  const demoFileInputRef = useRef<HTMLInputElement | null>(null);
  const bandImageInputRef = useRef<HTMLInputElement | null>(null);

  async function loadAll(bandId: string) {
    const [d, s, c] = await Promise.all([
      supabase.from("demos").select("*").eq("band_id", bandId).order("created_at", { ascending: false }),
      supabase.from("shows").select("id,title,venue,date_time").contains("lineup", [bandId]).order("date_time", { ascending: true }),
      supabase.from("comments").select("*").eq("target_type", "band").eq("target_id", bandId).order("created_at", { ascending: true }),
    ]);
    setDemos((d.data ?? []) as Demo[]);
    setShows((s.data ?? []) as Show[]);
    const cs = (c.data ?? []) as Comment[];
    setComments(cs);
    const ids = [...new Set(cs.map((x) => x.user_id))];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,username").in("id", ids);
      const map: Record<string, string> = {};
      (p ?? []).forEach((x: { id: string; username: string }) => (map[x.id] = x.username));
      setProfiles(map);
    }
  }

  useEffect(() => {
    supabase.from("bands").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (!data) { setNF(true); return; }
      setBand(data as Band);
      loadAll(data.id);
    });
  }, [slug]);

  if (notFoundFlag) throw notFound();
  if (!band) return <div className="p-8 text-muted-foreground">// loading...</div>;

  async function uploadDemo(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !demoFile || !newDemoTitle) return;
    const path = `${band!.id}/${Date.now()}-${demoFile.name}`;
    const { error: ue } = await supabase.storage.from("demos").upload(path, demoFile);
    if (ue) return toast.error(ue.message);
    const url = supabase.storage.from("demos").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("demos").insert({ band_id: band!.id, uploader_id: user.id, title: newDemoTitle, audio_url: url });
    if (error) return toast.error(error.message);
    setNewDemoTitle(""); setDemoFile(null);
    loadAll(band!.id);
    toast.success("demo dropped");
  }



  async function updateBandImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !isOwner) return;

    setBandImageUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${band!.id}/profile-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("band-images").upload(path, file, {
      upsert: true,
    });

    if (uploadError) {
      setBandImageUploading(false);
      toast.error(uploadError.message);
      return;
    }

    const imageUrl = supabase.storage.from("band-images").getPublicUrl(path).data.publicUrl;

    const { error: updateError } = await supabase
      .from("bands")
      .update({ image_url: imageUrl })
      .eq("id", band!.id);

    setBandImageUploading(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setBand((current) => (current ? { ...current, image_url: imageUrl } : current));
    toast.success("band photo updated");
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentBody.trim()) return;
    const { error } = await supabase.from("comments").insert({ user_id: user.id, target_type: "band", target_id: band!.id, body: commentBody });
    if (error) return toast.error(error.message);
    setCommentBody("");
    loadAll(band!.id);
  }

  async function report() {
    if (!user) return toast.error("login required");
    const reason = prompt("reason for report?");
    if (!reason) return;
    await supabase.from("reports").insert({ reporter_id: user.id, target_type: "band", target_id: band!.id, reason });
    toast.success("reported. mods notified.");
  }

  const isOwner = user?.id === band.owner_id || isAdmin;
  const links = Object.values(band.links ?? {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="terminal-frame pt-7 p-5 mb-6 flex flex-col md:flex-row gap-5">
        {band.image_url ? (
          <img src={band.image_url} alt={band.name} className="h-40 w-40 object-cover border border-border" />
        ) : (
          <div className="h-40 w-40 border border-border bg-muted flex items-center justify-center text-primary font-black text-5xl">
            {band.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-primary">// band.profile</div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-glow">{band.name}</h1>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{band.genre ?? "—"} // {band.city ?? "—"}</div>
          {band.bio && <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">{band.bio}</p>}
          {band.tags && band.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {band.tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground">#{t}</span>)}
            </div>
          )}
          {links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {links.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" className="text-primary hover:underline">[ link.{i + 1} ]</a>)}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase">
            <button onClick={report} className="border border-border px-2 py-1 hover:border-primary hover:text-primary flex items-center gap-1"><Flag className="h-3 w-3" /> report</button>
            {isOwner && (
              <>
                <span className="text-primary px-2 py-1 border border-primary">owner</span>
                <input
                  ref={bandImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={updateBandImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bandImageInputRef.current?.click()}
                  disabled={bandImageUploading}
                  className="border border-border px-2 py-1 hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {bandImageUploading ? "uploading image..." : "change band photo"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="// demos">
          {demos.length === 0 ? <Empty>no demos. drop one.</Empty> : (
            <ul className="space-y-3">
              {demos.map((d) => (
                <li key={d.id} className="border border-border p-3">
                  <div className="text-xs uppercase font-bold mb-1">{d.title}</div>
                  <audio controls src={d.audio_url} className="w-full" />
                </li>
              ))}
            </ul>
          )}
          {user && (
            <form onSubmit={uploadDemo} className="mt-3 space-y-2 text-xs border-t border-border pt-3">
              <input value={newDemoTitle} onChange={(e) => setNewDemoTitle(e.target.value)} placeholder="track title"
                className="w-full bg-input border border-border px-2 py-1 font-mono" />
              <input
                ref={demoFileInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => setDemoFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => demoFileInputRef.current?.click()}
                  className="border border-border px-3 py-1 uppercase tracking-widest text-[10px] hover:border-primary"
                >
                  browse audio
                </button>
                <span className="text-[10px] text-muted-foreground">
                  {demoFile ? demoFile.name : "no file selected"}
                </span>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground px-3 py-1 uppercase tracking-widest text-[10px] disabled:opacity-50" disabled={!demoFile || !newDemoTitle.trim()}>
                ▶ upload demo
              </button>
            </form>
          )}
        </Section>

        <Section title="// upcoming shows">
          {shows.length === 0 ? <Empty>no upcoming shows.</Empty> : (
            <ul className="space-y-2">
              {shows.map((s) => (
                <li key={s.id}><Link to="/shows/$id" params={{ id: s.id }} className="block border border-border p-3 hover:border-primary">
                  <div className="font-bold text-sm">{s.title}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{new Date(s.date_time).toLocaleString()} @ {s.venue}</div>
                </Link></li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="// merch" className="md:col-span-2">
          <div className="text-xs text-muted-foreground italic">// merch storefront coming soon. add bandcamp / shop links above for now.</div>
        </Section>

        <Section title="// comments" className="md:col-span-2">
          <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
            {comments.length === 0 && <Empty>no comments.</Empty>}
            {comments.map((c) => (
              <div key={c.id} className="border-l-2 border-primary/40 pl-3 py-1 text-sm">
                <div className="text-[10px] uppercase text-primary">@{profiles[c.user_id] ?? "?"}</div>
                <div className="whitespace-pre-wrap">{c.body}</div>
              </div>
            ))}
          </div>
          {user && (
            <form onSubmit={postComment} className="flex gap-2">
              <input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="leave a comment..."
                className="flex-1 bg-input border border-border px-2 py-1 text-sm font-mono" />
              <button className="bg-primary text-primary-foreground px-3 text-xs uppercase">post</button>
            </form>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flyer-card p-4 ${className}`}>
      <div className="text-xs uppercase tracking-widest text-primary mb-3">{title}</div>
      {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground italic py-2">{children}</div>;
}
