"use client";

import { useEffect, useState } from "react";

import { API_URL, apiFetch } from "@/lib/api";

type Status = "loading" | "ok" | "error";

export function BackendStatus() {
  const [api, setApi] = useState<Status>("loading");
  const [db, setDb] = useState<Status>("loading");

  useEffect(() => {
    apiFetch("/health")
      .then(() => setApi("ok"))
      .catch(() => setApi("error"));
    apiFetch("/health/db")
      .then(() => setDb("ok"))
      .catch(() => setDb("error"));
  }, []);

  return (
    <div className="w-full max-w-sm rounded-xl border border-black/10 p-5 dark:border-white/15">
      <p className="mb-3 text-sm text-zinc-500">
        Backend: <code className="font-mono">{API_URL}</code>
      </p>
      <StatusRow label="API" status={api} />
      <StatusRow label="Database" status={db} />
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: Status }) {
  const color = {
    loading: "bg-zinc-400",
    ok: "bg-emerald-500",
    error: "bg-red-500",
  }[status];
  return (
    <div className="flex items-center justify-between py-1">
      <span>{label}</span>
      <span className="flex items-center gap-2 text-sm">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {status}
      </span>
    </div>
  );
}
