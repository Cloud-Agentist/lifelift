import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PLATFORM_API = process.env.PLATFORM_API_URL || "http://localhost:3000";

/**
 * POST /api/push/subscribe — Save a push subscription for the current user.
 * Stores in platform's actor-registry as push_subscription on the actor.
 */
export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  try {
    const res = await fetch(`${PLATFORM_API}/push/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub: session.user.sub,
        subscription,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Failed to save push subscription:", err);
      return NextResponse.json({ error: "Failed to save" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

/**
 * DELETE /api/push/subscribe — Remove a push subscription.
 */
export async function DELETE(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  try {
    await fetch(`${PLATFORM_API}/push/subscriptions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sub: session.user.sub, endpoint }),
    });
  } catch { /* best effort */ }

  return NextResponse.json({ ok: true });
}
