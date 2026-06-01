"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export default function RealtimePage() {
  const [counter, setCounter] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const client = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    client.on("connect", () => {
      setConnected(true);
      setError(null);
    });

    client.on("disconnect", () => {
      setConnected(false);
    });

    client.on("connect_error", (err) => {
      setError(
        `Cannot connect to ${SOCKET_URL}. Run: npm run socket — ${err.message}`
      );
    });

    client.on("counter-updated", (value: number) => {
      setCounter(value);
    });

    setSocket(client);

    return () => {
      client.disconnect();
    };
  }, []);

  const increment = useCallback(() => {
    socket?.emit("increment-counter");
  }, [socket]);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/" className="text-sm text-blue-600 underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Real-time counter</h1>
      <p className="mt-2 text-sm text-slate-600">
        Socket.io on port 4000 — open this page in two tabs and click increment;
        both should update within 500ms.
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Status:{" "}
          <span
            className={
              connected ? "font-medium text-green-700" : "text-amber-700"
            }
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </p>

        <p className="mt-4 text-4xl font-bold tabular-nums">
          {counter === null ? "—" : counter}
        </p>

        <button
          type="button"
          onClick={increment}
          disabled={!connected}
          className="mt-6 w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Increment Counter
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Server: <code>{SOCKET_URL}</code>
      </p>
    </main>
  );
}
