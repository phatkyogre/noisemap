import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: Admin });

type Report = { id: string; reporter_id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string };

function Admin() {
  const { isAdmin, loading, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("reports").select("*").order("created_at", { ascending: false }).then(({ data }) => setReports((data ?? []) as Report[]));
  }, [isAdmin]);

  if (loading) return <div className="p-8 text-muted-foreground">// auth check...</div>;
  if (!user) return <Locked msg="login required" />;
  if (!isAdmin) return <Locked msg="ACCESS DENIED // not an admin. ask an existing admin to grant the role via user_roles table." />;

  async function remove(r: Report) {
    if (!confirm(`remove this ${r.target_type}?`)) return;
    const table = r.target_type === "band" ? "bands" : r.target_type === "show" ? "shows" : "comments";
    const { error } = await supabase.from(table).delete().eq("id", r.target_id);
    if (error) return toast.error(error.message);
    await supabase.from("reports").update({ status: "resolved" }).eq("id", r.id);
    setReports((p) => p.map((x) => x.id === r.id ? { ...x, status: "resolved" } : x));
    toast.success("removed");
  }

  async function dismiss(r: Report) {
    await supabase.from("reports").update({ status: "dismissed" }).eq("id", r.id);
    setReports((p) => p.map((x) => x.id === r.id ? { ...x, status: "dismissed" } : x));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="text-xs uppercase tracking-widest text-primary mb-2">// admin.dashboard</div>
      <h1 className="text-3xl font-bold uppercase mb-6">moderation queue</h1>
      <div className="space-y-2">
        {reports.length === 0 && <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">// queue clean. nothing to moderate.</div>}
        {reports.map((r) => (
          <div key={r.id} className="flyer-card p-4 grid sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {new Date(r.created_at).toLocaleString()} · target: <span className="text-primary">{r.target_type}</span> #{r.target_id.slice(0, 8)}
                · status: <span className={r.status === "open" ? "text-primary" : "text-muted-foreground"}>{r.status}</span>
              </div>
              <div className="mt-1 text-sm">{r.reason}</div>
            </div>
            {r.status === "open" && (
              <div className="flex gap-2 self-center">
                <button onClick={() => remove(r)} className="bg-primary text-primary-foreground px-3 py-1 text-xs uppercase">remove</button>
                <button onClick={() => dismiss(r)} className="border border-border px-3 py-1 text-xs uppercase hover:border-primary">dismiss</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Locked({ msg }: { msg: string }) {
  return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-primary border border-primary/40 mt-8 terminal-frame pt-7">{msg}</div>;
}
