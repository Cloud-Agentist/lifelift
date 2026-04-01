"use client";

import { useState } from "react";

export default function CopyInviteLink({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        readOnly
        value={inviteUrl}
        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono"
      />
      <button
        onClick={handleCopy}
        className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          copied
            ? "bg-emerald-600 text-white"
            : "bg-indigo-600 hover:bg-indigo-500 text-white"
        }`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
