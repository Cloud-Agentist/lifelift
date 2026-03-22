import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { ensureActor, listEvents, listMemories, listPendingApprovals, listRecentApprovals } from "@/lib/platform";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = session.user.sub as string;
  const displayName = (session.user.name ?? session.user.email ?? "User") as string;

  try {
    const actor = await ensureActor(sub, displayName);
    const actorId = actor.actor_id;

    const [events, memories, pendingApprovals, recentApprovals] = await Promise.all([
      listEvents(actorId, 100),
      listMemories(actorId, 100),
      listPendingApprovals(actorId),
      listRecentApprovals(actorId, 100),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: session.user.email,
        name: session.user.name,
        actorId,
      },
      interactions: events,
      memories,
      approvals: {
        pending: pendingApprovals,
        recent: recentApprovals,
      },
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cloud-agentist-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
