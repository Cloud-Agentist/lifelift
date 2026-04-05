"use server";

import { interact, decideApproval, listEvents } from "@/lib/platform";

// Simple in-memory rate limiter: max 8 messages per 30 seconds per actor
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 30_000;
const RATE_LIMIT_MAX = 8;

function checkRateLimit(actorId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(actorId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(actorId, timestamps);
  return true;
}

interface SendMessageArgs {
  actorId: string;
  input: string;
  sessionId?: string;
}

export interface ProposedIntent {
  intentId?: string;
  action: string;
  parameters?: Record<string, unknown>;
  rationale?: string;
  sensitiveAction?: boolean;
  /** Set after approval flow creates a request */
  approvalId?: string;
}

export interface VisualPanel {
  panelType: "calendar" | "wishlist" | "approval" | "search-results" | "financial" | "memory" | "none";
  title?: string;
  data?: Record<string, unknown>;
}

export interface SendMessageResult {
  text: string;
  sessionId?: string;
  eventId?: string;
  workflowId?: string;
  proposedIntents?: ProposedIntent[];
  visual?: VisualPanel;
}

/**
 * Send a message through the full governed actor interaction flow.
 */
export async function sendMessage(args: SendMessageArgs): Promise<SendMessageResult> {
  if (!checkRateLimit(args.actorId)) {
    return { text: "You're sending messages too quickly. Please wait a moment and try again." };
  }
  try {
    const result = await interact(args.actorId, args.input, args.sessionId);
    return {
      text: result.text,
      sessionId: result.workflowId,
      eventId: result.eventId,
      workflowId: result.workflowId,
      proposedIntents: result.proposedIntents as ProposedIntent[] | undefined,
      visual: result.visual as VisualPanel | undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      text: `Sorry, I couldn't process that right now. (${message})`,
    };
  }
}

/**
 * Load previous chat messages from event-store.
 * Reconstructs user/assistant message pairs from interaction events.
 */
export async function loadChatHistory(
  actorId: string,
  limit = 20,
): Promise<Array<{ role: "user" | "assistant"; content: string; timestamp: string }>> {
  try {
    const events = await listEvents(actorId, limit);
    const interactions = events
      .filter((e) => (e.event_type ?? e.eventType) === "interaction")
      .reverse(); // oldest first

    const messages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }> = [];
    for (const event of interactions) {
      const payload = event.payload as Record<string, unknown>;
      const input = payload.input as string | undefined;
      const output = payload.output as Record<string, unknown> | undefined;
      const ts = event.created_at ?? event.occurredAt ?? "";

      if (input) {
        messages.push({ role: "user", content: input, timestamp: ts });
      }
      if (output?.text) {
        messages.push({ role: "assistant", content: output.text as string, timestamp: ts });
      }
    }
    return messages;
  } catch {
    return [];
  }
}

/**
 * Approve or deny a proposed action from within the chat.
 */
export async function decideIntent(
  approvalId: string,
  decision: "approved" | "denied",
): Promise<{ ok: boolean; error?: string }> {
  return decideApproval(approvalId, decision);
}
