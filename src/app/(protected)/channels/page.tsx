import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { ensureActor } from "@/lib/platform";
import Link from "next/link";

const PLATFORM_API = process.env.PLATFORM_API_URL || "http://localhost:3000";

interface Channel {
  channel_id: string;
  purpose: string;
  status: string;
  created_at: string;
  participants?: Array<{ agent_id: string; agent_name?: string; consent_status: string }>;
}

export default async function ChannelsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login?returnTo=/channels");

  let actor: { actor_id: string };
  try {
    actor = await ensureActor(
      session.user.sub as string,
      (session.user.name ?? session.user.email ?? "User") as string,
    );
  } catch {
    actor = { actor_id: "00000000-0000-0000-0000-000000000001" };
  }

  let channels: Channel[] = [];
  try {
    const res = await fetch(`${PLATFORM_API}/channels?humanId=${actor.actor_id}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { channels?: Channel[] };
      channels = data.channels ?? [];
    }
  } catch { /* unavailable */ }

  const statusColors: Record<string, string> = {
    active: "text-emerald-400",
    pending: "text-amber-400",
    paused: "text-slate-400",
    closed: "text-slate-600",
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Channels</h1>
          <p className="text-sm text-slate-400">Interactions between your agent and others</p>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">🤝</div>
          <p className="text-slate-400 mb-2">No agent interactions yet</p>
          <p className="text-xs text-slate-500">
            When your agent coordinates with someone else's agent — like scheduling a meeting —
            the conversation will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => (
            <Link
              key={ch.channel_id}
              href={`/channels/${ch.channel_id}`}
              className="block bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{ch.purpose}</h3>
                <span className={`text-xs font-bold uppercase ${statusColors[ch.status] ?? "text-slate-500"}`}>
                  {ch.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Started {new Date(ch.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
