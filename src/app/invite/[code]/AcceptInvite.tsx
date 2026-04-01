"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AcceptInvite({ inviterName }: { inviterName: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className={`max-w-sm w-full text-center transition-all duration-500 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="text-4xl mb-4">🤝</div>
        <h1 className="text-xl font-bold text-white mb-2">Connected!</h1>
        <p className="text-sm text-slate-400 mb-6">
          You and {inviterName} are now connected. Your agents can coordinate
          on scheduling, shared tasks, and more.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/contacts"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            View contacts
          </Link>
          <Link
            href="/dashboard"
            className="border border-slate-700 hover:border-slate-600 text-slate-300 px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
