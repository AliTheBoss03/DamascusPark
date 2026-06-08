"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  startedAt: string;
  className?: string;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function SessionTimer({ startedAt, className = "" }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Date.now() - start);
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 tabular-nums font-mono ${className}`}
    >
      <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
      {formatDuration(elapsed)}
    </span>
  );
}
