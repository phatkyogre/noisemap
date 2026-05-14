import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Calendar, MapPin, Lock, Flag } from "lucide-react";

export const Route = createFileRoute("/shows/$id")({ component: ShowPage });

type Show = { id: string; title: string; venue: string; location: string | null; lat: number | null; lng: number | null; date_time: string; lineup: string[] | null; notes: string | null; flyer_url: string | null; is_secret: boolean; creator_id: string; venue_type: string | null };
type RSVP = { user_id: string; status: "going" | "maybe" | "no" };
type Comment = { id: string; user_id: string; body: string; created_at: string };
type Msg = { id: string; user_id: string; body: string; created_at: string };

function ShowPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [show, setShow] = useState<Show | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [myRsvp, setMyRsvp] = useState<RSVP["status"] | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [nf, setNF] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  async function loadProfiles(ids: string[]) {
    if (!ids.length) return;
    const { data } = await supabase.from("profiles").select("id,username").in("id", ids);
    setProfiles((prev) => {
      const next = { ...prev };
      (data ?? []).forEach((x: { id: string; username: string }) => (next[x.id] = x.username));
      return next;
    });
  }

  useEffect(() => {
    supabase.from("shows").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      if (!data) return setNF(true);
      setShow(data as Show);
    });
    supabase.from("rsvps").select("user_id,status").eq("show_id", id).then(({ data }) => {
      const r = (data ?? []) as RSVP[];
      setRsvps(r);
      if (user) setMyRsvp(r.find((x) => x.user_id === user.id)?.status ?? null);
    });
    supabase.from("comments").select("*").eq("target_type", "show").eq("target_id", id).order("created_at").then(({ data }) => {
      const c = (data ?? []) as Comment[]; setComments(c);
      loadProfiles([...new Set(c.map((x) => x.user_id))]);
    });
    supabase.from("chat_messages").select("*").eq("show_id", id).order("created_at").limit(100).then(({ data }) => {
      const m = (data ?? []) as Msg[]; setMsgs(m);
      loadProfiles([...new Set(m.map((x) => x.user_id))]);
    });

    const chat = supabase.channel(`show-chat-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `show_id=eq.${id}` }, (p) => {
        const m = p.new as Msg;
        setMsgs((prev) => [...prev, m]);
        loadProfiles([m.user_id]);
      }).subscribe();
    const rsvpCh = supabase.channel(`show-rsvp-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps", filter: `show_id=eq.${id}` }, () => {
        supabase.from("rsvps").select("user_id,status").eq("show_id", id).then(({ data }) => {
          const r = (data ?? []) as RSVP[]; setRsvps(r);
          if (user) setMyRsvp(r.find((x) => x.user_id === user.id)?.status ?? null);
        });
      }).subscribe();
    return () => { supabase.removeChannel(chat); supabase.removeChannel(rsvpCh); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight }); }, [msgs.length]);

  if (nf) throw notFound();
  if (!show) return <div className="p-8 text-muted-foreground">// loading...</div>;

  const counts = { going: rsvps.filter(r => r.status === "going").length, maybe: rsvps.filter(r => r.status === "maybe").length, no: rsvps.filter(r => r.status === "no").length };

  async function setRsvp(status: RSVP["status"]) {
    if (!user) return toast.error("login first");
    const { error } = await supabase.from("rsvps").upsert({ show_id: id, user_id: user.id, status }, { onConflict: "show_id,user_id" });
    if (error) toast.error(error.message);
    else setMyRsvp(status);
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !chatInput.trim()) return;
    const body = chatInput; setChatInput("");
    const { error } = await supabase.from("chat_messages").insert({ show_id: id, user_id: user.id, body });
    if (error) toast.error(error.message);
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentBody.trim()) return;
    const { error } = await supabase.from("comments").insert({ user_id: user.id, target_type: "show", target_id: id, body: commentBody });
    if (error) return toast.error(error.message);
    setCommentBody("");
    const { data } = await supabase.from("comments").select("*").eq("target_type", "show").eq("target_id", id).order("created_at");
    setComments((data ?? []) as Comment[]);
  }

  async function report() {
    if (!user) return toast.error("login required");
    const reason = prompt("reason?"); if (!reason) return;
    await supabase.from("reports").insert({ reporter_id: user.id, target_type: "show", target_id: id, reason });
    toast.success("reported.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <div className="terminal-frame pt-7 overflow-hidden mb-6">
          {show.flyer_url && (
            <div className="aspect-[16/9] bg-black overflow-hidden">
              <img src={show.flyer_url} alt={show.title} className="w-full h-full object-contain bg-black" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-primary">// show.event</div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-glow break-words">{show.title}</h1>
              </div>
              {show.is_secret && <div className="bg-background border border-primary text-primary px-2 py-1 text-[10px] uppercase flex items-center gap-1"><Lock className="h-3 w-3" /> secret</div>}
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-primary" /> {new Date(show.date_time).toLocaleString()}</div>
              <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /> {show.venue} {show.location ? `// ${show.location}` : ""}</div>
            </div>
            {show.lineup && show.lineup.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-widest text-primary mb-1">// lineup</div>
                <div className="flex flex-wrap gap-2">
                  {show.lineup.map((b, i) => <span key={i} className="border border-border px-2 py-0.5 text-xs">{b}</span>)}
                </div>
              </div>
            )}
            {show.notes && <p className="mt-4 text-sm text-foreground/80 whitespace-pre-wrap border-l-2 border-primary/40 pl-3">{show.notes}</p>}
            <div className="mt-4 flex gap-2 text-[10px] uppercase">
              <button onClick={report} className="border border-border px-2 py-1 hover:border-primary hover:text-primary flex items-center gap-1"><Flag className="h-3 w-3" /> report</button>
            </div>
          </div>
        </div>

        <div className="flyer-card p-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">// rsvp</div>
          <div className="flex gap-2 flex-wrap">
            {(["going", "maybe", "no"] as const).map((st) => (
              <button key={st} onClick={() => setRsvp(st)}
                className={`px-3 py-2 text-xs uppercase tracking-widest border ${myRsvp === st ? "bg-primary text-primary-foreground border-primary border-glow" : "border-border hover:border-primary"}`}>
                {st} <span className="text-muted-foreground ml-1">[{counts[st]}]</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flyer-card p-4">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">// comments</div>
          <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
            {comments.length === 0 && <div className="text-xs text-muted-foreground italic">no comments.</div>}
            {comments.map((c) => (
              <div key={c.id} className="border-l-2 border-primary/40 pl-3 py-1 text-sm">
                <div className="text-[10px] uppercase text-primary">@{profiles[c.user_id] ?? "?"}</div>
                <div className="whitespace-pre-wrap">{c.body}</div>
              </div>
            ))}
          </div>
          {user && (
            <form onSubmit={addComment} className="flex gap-2">
              <input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="leave a comment..."
                className="flex-1 bg-input border border-border px-2 py-1 text-sm font-mono" />
              <button className="bg-primary text-primary-foreground px-3 text-xs uppercase">post</button>
            </form>
          )}
        </div>
      </div>

      {/* Live chat */}
      <aside className="lg:sticky lg:top-16 self-start">
        <div className="terminal-frame pt-7 flex flex-col h-[600px]">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-primary">// live.chat</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 bg-primary blink rounded-full" /> realtime</div>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-mono">
            {msgs.length === 0 && <div className="text-muted-foreground italic">// empty room. say something.</div>}
            {msgs.map((m) => (
              <div key={m.id}>
                <span className="text-primary">@{profiles[m.user_id] ?? "?"}:</span> <span className="text-foreground/90">{m.body}</span>
              </div>
            ))}
          </div>
          {user ? (
            <form onSubmit={sendMsg} className="border-t border-border p-2 flex gap-2">
              <span className="text-primary text-xs">$</span>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="type message..."
                className="flex-1 bg-transparent text-xs font-mono focus:outline-none" />
            </form>
          ) : (
            <div className="border-t border-border p-2 text-[10px] uppercase text-muted-foreground text-center">login to chat</div>
          )}
        </div>
      </aside>
    </div>
  );
}
