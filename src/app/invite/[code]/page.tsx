import { auth0 } from "@/lib/auth0";
import { ensureActor } from "@/lib/platform";
import { redirect } from "next/navigation";
import AcceptInvite from "./AcceptInvite";

const PLATFORM_API = process.env.PLATFORM_API_URL || "http://localhost:3000";

interface InviterInfo {
  actor_id: string;
  display_name: string | null;
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Decode invite code → actor ID
  let inviterActorId: string;
  try {
    inviterActorId = Buffer.from(code, "base64url").toString();
  } catch {
    return <ErrorState message="Invalid invitation link" />;
  }

  // Validate the inviter exists
  let inviter: InviterInfo | null = null;
  try {
    const res = await fetch(`${PLATFORM_API}/actors/${inviterActorId}`, { cache: "no-store" });
    if (res.ok) {
      inviter = (await res.json()) as InviterInfo;
    }
  } catch { /* unavailable */ }

  if (!inviter) {
    return <ErrorState message="This invitation is no longer valid" />;
  }

  // Check if current user is logged in
  const session = await auth0.getSession();

  if (!session?.user) {
    // Not logged in — show invitation with login CTA
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <img src="/brand/mascot-512.png" alt="Cloud Agentist" className="h-20 w-auto mx-auto mb-6" />
          <h1 className="text-xl font-bold text-white mb-2">
            {inviter.display_name ?? "Someone"} invited you
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Connect your AI agents to coordinate on scheduling, shared tasks, and more.
          </p>
          <a
            href={`/auth/login?returnTo=/invite/${code}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Sign in to accept
          </a>
          <p className="text-xs text-slate-600 mt-4">
            Don&apos;t have an account? Signing in will create one.
          </p>
        </div>
      </div>
    );
  }

  // Logged in — create the connection
  let myActor: { actor_id: string };
  try {
    myActor = await ensureActor(
      session.user.sub as string,
      (session.user.name ?? session.user.email ?? "User") as string,
    );
  } catch {
    return <ErrorState message="Could not resolve your account" />;
  }

  // Don't connect with yourself
  if (myActor.actor_id === inviterActorId) {
    redirect("/contacts");
  }

  // Create the connection
  try {
    await fetch(`${PLATFORM_API}/contacts/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorId: myActor.actor_id,
        contactActorId: inviterActorId,
      }),
    });
  } catch {
    return <ErrorState message="Could not complete the connection" />;
  }

  return (
    <AcceptInvite inviterName={inviter.display_name ?? "your contact"} />
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-3xl mb-4">😕</div>
        <p className="text-slate-400 mb-4">{message}</p>
        <a href="/dashboard" className="text-indigo-400 text-sm hover:text-indigo-300">
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
