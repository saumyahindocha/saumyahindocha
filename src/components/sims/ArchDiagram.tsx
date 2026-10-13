"use client";

import { useState } from "react";

/*
  Station Parking's components, from docs/ARCHITECTURE.md §1–2 of the
  Car-parking-software repo. Click a box to see what it does and its tech.
*/

type Node = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  what: string;
  tech: string;
};

const NODES: Node[] = [
  {
    id: "cams",
    name: "Cameras",
    x: 20,
    y: 40,
    w: 130,
    what: "Four ANPR cameras and two overview cameras on the two gates, streaming RTSP on the site LAN.",
    tech: "RTSP, site LAN",
  },
  {
    id: "anpr",
    name: "anpr",
    x: 200,
    y: 40,
    w: 130,
    what: "Camera ingest → detect → track → plate → OCR → multi-frame vote → validate → cross-camera merge → event, with a durable outbox.",
    tech: "Python 3.12, OpenCV, ONNX Runtime/TensorRT",
  },
  {
    id: "backend",
    name: "backend",
    x: 380,
    y: 40,
    w: 150,
    what: "The source of truth: sessions, matching, tariff, ledger, payments, cash control, passes, receipts, disputes, reports, jobs and a WebSocket hub.",
    tech: "FastAPI, SQLAlchemy 2, PostgreSQL 16, Alembic",
  },
  {
    id: "db",
    name: "PostgreSQL 16",
    x: 580,
    y: 40,
    w: 130,
    what: "Every table, with an append-only ledger. Money is integer paise; time is UTC.",
    tech: "PostgreSQL 16",
  },
  {
    id: "dash",
    name: "dashboard",
    x: 240,
    y: 170,
    w: 130,
    what: "Admin and supervisor web app: live view, review queue, cash control, ledger, reports and config.",
    tech: "React + TypeScript + Vite, served by the backend",
  },
  {
    id: "worker",
    name: "worker app",
    x: 390,
    y: 170,
    w: 130,
    what: "Worker, guard and supervisor Android app that keeps working offline and queues its actions.",
    tech: "Flutter, sqflite queue",
  },
  {
    id: "alert",
    name: "alert unit",
    x: 540,
    y: 170,
    w: 130,
    what: "Exit display, tower light and buzzer at each gate, fed by a WebSocket topic per gate.",
    tech: "Python on Raspberry Pi 5, pygame, gpiozero",
  },
  {
    id: "relay",
    name: "cloud relay",
    x: 380,
    y: 290,
    w: 150,
    what: "Customer pages for self-pay, dues lookup, pass purchase and receipts. The edge server only ever connects out to it.",
    tech: "FastAPI + Jinja2",
  },
  {
    id: "deploy",
    name: "deploy",
    x: 20,
    y: 290,
    w: 130,
    what: "One-command installer, Docker Compose, NTP, encrypted backups and a weekly restore test.",
    tech: "Docker, chrony, pg_dump, age, rclone",
  },
];

const EDGES: [string, string, string][] = [
  ["cams", "anpr", "RTSP"],
  ["anpr", "backend", "events"],
  ["backend", "db", ""],
  ["backend", "dash", "WS"],
  ["backend", "worker", "REST"],
  ["backend", "alert", "WS"],
  ["backend", "relay", "HTTPS out"],
];

const H = 46;
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

function anchor(a: Node, b: Node): [number, number, number, number] {
  // The relay drops straight down through the gap between the worker app and the alert unit.
  if (b.id === "relay") return [530, a.y + H, 530, b.y];
  const ax = a.x + a.w / 2;
  const ay = a.y + H / 2;
  const bx = b.x + b.w / 2;
  const by = b.y + H / 2;
  if (Math.abs(ay - by) < 10) {
    const dir = Math.sign(bx - ax);
    return [ax + (dir * a.w) / 2, ay, bx - (dir * b.w) / 2, by];
  }
  return [ax + (bx - ax) * 0.15, a.y + H, bx, b.y];
}

export function ArchDiagram() {
  const [sel, setSel] = useState("backend");
  const node = byId[sel];
  return (
    <div className="grid gap-4 rounded-md border border-line bg-surface/70 p-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      {/* Phones get the components as a list; the diagram needs the width. */}
      <div className="flex flex-wrap gap-1.5 md:hidden">
        {NODES.map((n) => (
          <button
            key={n.id}
            type="button"
            aria-pressed={sel === n.id}
            onClick={() => setSel(n.id)}
            className={`rounded-[3px] border px-2.5 py-1 font-mono text-xs ${sel === n.id ? "border-brass bg-brass text-mat-shade" : "border-line-strong text-ink"}`}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div className="hidden md:block">
        <svg viewBox="0 0 730 350" className="w-full" role="group" aria-label="System architecture">
          <defs>
            <marker
              id="arch-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0 0 8 4 0 8z" fill="rgba(169,189,164,0.8)" />
            </marker>
          </defs>
          <rect
            x="190"
            y="18"
            width="530"
            height="216"
            rx="6"
            fill="none"
            stroke="rgba(242,239,230,0.18)"
            strokeDasharray="5 5"
          />
          <text x="200" y="32" fill="#7f977b" fontSize="11" fontFamily="var(--font-mono)">
            EDGE SERVER · SITE LAN
          </text>
          {EDGES.map(([a, b, l]) => {
            const [x1, y1, x2, y2] = anchor(byId[a], byId[b]);
            return (
              <g key={a + b}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(169,189,164,0.6)"
                  strokeWidth="1.2"
                  markerEnd="url(#arch-arrow)"
                />
                {l && (
                  <text
                    x={(x1 + x2) / 2 + (y1 === y2 ? 0 : 6)}
                    y={b === "relay" ? y2 - 14 : (y1 + y2) / 2 - 5}
                    fill="#7f977b"
                    fontSize="10"
                    textAnchor={y1 === y2 ? "middle" : "start"}
                    fontFamily="var(--font-mono)"
                  >
                    {l}
                  </text>
                )}
              </g>
            );
          })}
          {NODES.map((n) => (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-pressed={sel === n.id}
              aria-label={n.name}
              onClick={() => setSel(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSel(n.id);
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[#ddb06f]"
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={H}
                rx="4"
                fill={sel === n.id ? "#ddb06f" : "#10291f"}
                stroke={sel === n.id ? "#ddb06f" : "rgba(242,239,230,0.3)"}
                strokeWidth="1.5"
              />
              <text
                x={n.x + n.w / 2}
                y={n.y + H / 2 + 4}
                textAnchor="middle"
                fontSize="13"
                fill={sel === n.id ? "#10291f" : "#f2efe6"}
                fontFamily="var(--font-mono)"
              >
                {n.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div aria-live="polite" className="space-y-2">
        <h3 className="font-mono text-silk text-sage uppercase">{node.name}</h3>
        <p className="text-sm leading-relaxed text-ink">{node.what}</p>
        <p className="font-mono text-xs text-brass">{node.tech}</p>
        <p className="pt-2 text-xs text-sage">Pick a component to see what it does.</p>
      </div>
    </div>
  );
}
