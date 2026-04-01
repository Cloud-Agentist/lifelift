"use client";

import { useEffect, useState } from "react";
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
} from "@/lib/push";

export default function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<string>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sup = isPushSupported();
    setSupported(sup);
    setPermission(getPermissionState());
    if (sup) {
      isSubscribed().then(setSubscribed);
    }
  }, []);

  async function handleToggle() {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        const result = await subscribeToPush();
        if (result.ok) {
          setSubscribed(true);
          setPermission("granted");
        } else {
          setPermission(getPermissionState());
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg">
        <div>
          <div className="text-sm font-medium text-slate-200">Push Notifications</div>
          <div className="text-xs text-slate-500 mt-0.5">Not supported in this browser</div>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg">
        <div>
          <div className="text-sm font-medium text-slate-200">Push Notifications</div>
          <div className="text-xs text-red-400 mt-0.5">Blocked — enable in browser settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg">
      <div>
        <div className="text-sm font-medium text-slate-200">Push Notifications</div>
        <div className="text-xs text-slate-500 mt-0.5">
          {subscribed
            ? "Get notified when your agent needs your attention"
            : "Enable to get alerts for approvals and agent findings"}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          subscribed ? "bg-indigo-600" : "bg-slate-700"
        } ${loading ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            subscribed ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
