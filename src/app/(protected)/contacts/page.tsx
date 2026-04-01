import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { ensureActor } from "@/lib/platform";
import Link from "next/link";
import CopyInviteLink from "./CopyInviteLink";

const PLATFORM_API = process.env.PLATFORM_API_URL || "http://localhost:3000";
const APP_URL = process.env.APP_BASE_URL || "https://cloudagentist.com";

interface Contact {
  contact_id: string;
  contact_actor_id: string;
  contact_display_name: string | null;
  contact_avatar_url: string | null;
  accepted_at: string;
}

export default async function ContactsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login?returnTo=/contacts");

  let actor: { actor_id: string };
  try {
    actor = await ensureActor(
      session.user.sub as string,
      (session.user.name ?? session.user.email ?? "User") as string,
    );
  } catch {
    actor = { actor_id: "00000000-0000-0000-0000-000000000001" };
  }

  const inviteCode = Buffer.from(actor.actor_id).toString("base64url");
  const inviteUrl = `${APP_URL}/invite/${inviteCode}`;

  // Fetch contacts
  let contacts: Contact[] = [];
  try {
    const res = await fetch(`${PLATFORM_API}/contacts?actorId=${actor.actor_id}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { contacts?: Contact[] };
      contacts = data.contacts ?? [];
    }
  } catch { /* unavailable */ }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Contacts</h1>
      <p className="text-sm text-slate-400 mb-8">
        Connect with others so your agents can coordinate.
      </p>

      {/* Invite */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Invite someone
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Share this link with someone. When they open it, your agents will be connected
          and can coordinate on scheduling, shared tasks, and more.
        </p>
        <CopyInviteLink inviteUrl={inviteUrl} />
      </section>

      {/* Connected contacts */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Connected Contacts
        </h2>
        {contacts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <div className="text-3xl mb-3">👥</div>
            <p className="text-slate-400 mb-2">No contacts yet</p>
            <p className="text-xs text-slate-500">
              Share your invitation link to connect with others. Once connected,
              your agents can coordinate meetings, share wishlists, and collaborate.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                key={c.contact_id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {c.contact_avatar_url ? (
                    <img src={c.contact_avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                      {(c.contact_display_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {c.contact_display_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Connected {new Date(c.accepted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/chat?prompt=${encodeURIComponent(`Start a channel with ${c.contact_display_name ?? "my contact"} to schedule a meeting`)}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-900 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Schedule
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
