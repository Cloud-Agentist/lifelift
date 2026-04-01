import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import Link from "next/link";

const PLATFORM_API = process.env.PLATFORM_API_URL || "http://localhost:3000";

interface ChannelResponse {
  channel: {
    channel_id: string;
    purpose: string;
    status: string;
    created_at: string;
  };
  participants: Array<{
    actor_id: string;
    role: string;
    agent_name?: string;
    consent_status: string;
  }>;
  messages: Array<{
    message_id: string;
    sender_id: string;
    content: string;
    message_type: string;
    created_at: string;
  }>;
}

export default async function ChannelDetailPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  let data: ChannelResponse | null = null;
  try {
    const res = await fetch(`${PLATFORM_API}/channels/${channelId}`, { cache: "no-store" });
    if (res.ok) data = (await res.json()) as ChannelResponse;
  } catch { /* unavailable */ }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center">
        <p className="text-slate-400">Channel not found</p>
        <Link href="/channels" className="text-indigo-400 text-sm">← Back to channels</Link>
      </div>
    );
  }

  const { channel, participants, messages } = data;

  const typeIcons: Record<string, string> = {
    system: "⚙️",
    message: "💬",
    proposal: "📋",
    accept: "✅",
    decline: "❌",
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/channels" className="text-xs text-slate-500 hover:text-slate-300 mb-4 inline-block">
        ← Back to channels
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{channel.purpose}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {participants.length} participants · {channel.status}
          </p>
        </div>
        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
          channel.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
          channel.status === "pending" ? "bg-amber-500/20 text-amber-400" :
          "bg-slate-700 text-slate-400"
        }`}>
          {channel.status}
        </span>
      </div>

      {/* Participants */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {participants.map((p) => (
          <div key={p.actor_id} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            <span className="text-sm text-slate-200">{p.agent_name ?? p.actor_id.slice(0, 8)}</span>
            <span className={`text-[10px] font-bold ${
              p.consent_status === "accepted" ? "text-emerald-400" :
              p.consent_status === "invited" ? "text-amber-400" :
              "text-red-400"
            }`}>
              {p.consent_status}
            </span>
            {p.role === "initiator" && (
              <span className="text-[10px] text-indigo-400 font-bold">initiator</span>
            )}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div key={msg.message_id} className={`rounded-lg p-4 ${
            msg.message_type === "system" ? "bg-slate-800/30 border border-slate-800/50" : "bg-slate-900 border border-slate-800"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{typeIcons[msg.message_type] ?? "💬"}</span>
              <span className="text-sm font-medium text-slate-200">
                {participants.find((p) => p.actor_id === msg.sender_id)?.agent_name ?? msg.sender_id.slice(0, 8)}
              </span>
              <span className="text-[10px] text-slate-600 uppercase">{msg.message_type}</span>
              <span className="text-xs text-slate-600 ml-auto">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm text-slate-300 whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No messages yet</p>
        )}
      </div>
    </div>
  );
}
