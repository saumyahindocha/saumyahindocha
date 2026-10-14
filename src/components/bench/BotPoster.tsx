"use client";

import { useState } from "react";

/**
 * Hero centrepiece until the 3D model lands (stage 3): NIDS drawn as a dimensioned side view.
 * Known geometry from the self-balancing-bot repo: 100 mm wheels, 230 × 100 × 6 mm acrylic
 * plates on M6 rods, CoG 0.108 m above the axle (matlab/balance_model.m). Plate spacing is not
 * documented, so it is drawn but not dimensioned.
 *
 * After drawing in, the body rocks about the axle and settles, like recovering from a push.
 * Click (or press Enter) to push it again. Illustration only; the real sim is stage 3.
 */
const S = 1.7; // px per mm
const CX = 262; // x of the axle line in px
const X = (mm: number) => CX + mm * S;
const Y = (mm: number) => 60 + (250 - mm) * S; // mm above ground -> px
const AXLE = 50;
const COG = AXLE + 108;

const INK = "#f2efe6";
const SAGE = "#a9bda4";
const BRASS = "#eaa682";

export function BotPoster({ className = "" }: { className?: string }) {
  const [pushes, setPushes] = useState(0);

  return (
    <button
      type="button"
      onClick={() => setPushes((n) => n + 1)}
      aria-label="Give the robot a push"
      className="group block w-full cursor-pointer rounded-md"
    >
      <svg
        viewBox="0 0 540 520"
        className={`${className} ${pushes > 0 ? "no-plot" : ""}`}
        role="img"
        aria-label="Side view drawing of the NIDS self-balancing robot: 100 millimetre wheels, three acrylic plates on M6 rods, the battery on top, and the centre of gravity 108 millimetres above the axle."
      >
        <defs>
          <marker
            id="bp-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0.8 L8 4 L0 7.2 Z" fill={SAGE} />
          </marker>
          <pattern
            id="bp-hatch"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke={SAGE} strokeOpacity="0.35" />
          </pattern>
          <filter id="bp-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="10"
              floodColor="#05120c"
              floodOpacity="0.55"
            />
          </filter>
        </defs>

        {/* Ground */}
        <g className="plot-fade" style={{ animationDelay: "200ms" }}>
          <line x1={X(-120)} y1={Y(0)} x2={X(120)} y2={Y(0)} stroke={SAGE} strokeOpacity="0.7" />
          <rect x={X(-120)} y={Y(0)} width={240 * S} height={10} fill="url(#bp-hatch)" />
        </g>

        {/* Body: rocks about the axle */}
        <g
          key={pushes}
          className={pushes > 0 ? "bot-sway bot-sway-now" : "bot-sway"}
          style={{ transformOrigin: `${CX}px ${Y(AXLE)}px` }}
        >
          <g fill="none" stroke={INK} strokeOpacity="0.8" strokeWidth="1.2">
            {/* M6 rods */}
            {[-44, 44].map((x) => (
              <line
                key={x}
                x1={X(x)}
                y1={Y(62)}
                x2={X(x)}
                y2={Y(214)}
                strokeOpacity="0.55"
                pathLength={1}
                className="plot"
              />
            ))}
            {/* Plates, 6 mm acrylic, 100 mm deep */}
            {[66, 130, 200].map((y, i) => (
              <rect
                key={y}
                x={X(-50)}
                y={Y(y + 6)}
                width={100 * S}
                height={6 * S}
                rx={1}
                fill="#1a4434"
                pathLength={1}
                className="plot"
                style={{ animationDelay: `${150 * i}ms` }}
              />
            ))}
            {/* Nuts above and below each plate */}
            {[66, 130, 200].flatMap((y) =>
              [-44, 44].flatMap((x) =>
                [Y(y + 6) - 3, Y(y)].map((ny) => (
                  <rect
                    key={`${x}-${y}-${ny}`}
                    x={X(x) - 4}
                    y={ny}
                    width={8}
                    height={3}
                    fill={SAGE}
                    fillOpacity="0.5"
                    stroke="none"
                    className="plot-fade"
                    style={{ animationDelay: "900ms" }}
                  />
                )),
              ),
            )}
          </g>

          {/* Electronics */}
          <g className="plot-fade" style={{ animationDelay: "800ms" }}>
            {/* 3S LiPo on the top plate */}
            <rect
              x={X(-40)}
              y={Y(230)}
              width={80 * S}
              height={24 * S}
              rx={3}
              fill="#21503d"
              stroke={BRASS}
              strokeOpacity="0.8"
            />
            {/* Arduino Mega + MPU6500 on the middle plate */}
            <rect
              x={X(-36)}
              y={Y(146)}
              width={60 * S}
              height={10 * S}
              fill="#173d2e"
              stroke={SAGE}
            />
            <rect
              x={X(30)}
              y={Y(141)}
              width={10 * S}
              height={5 * S}
              fill="#173d2e"
              stroke={BRASS}
              strokeOpacity="0.8"
            />
            {/* L298N with heatsink fins on the bottom plate */}
            <rect
              x={X(-30)}
              y={Y(96)}
              width={40 * S}
              height={24 * S}
              fill="#173d2e"
              stroke={SAGE}
              strokeOpacity="0.7"
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={X(-26 + i * 8)}
                y1={Y(96)}
                x2={X(-26 + i * 8)}
                y2={Y(84)}
                stroke={SAGE}
                strokeOpacity="0.5"
              />
            ))}
          </g>

          {/* Centre of gravity */}
          <g className="plot-fade" style={{ animationDelay: "1200ms" }}>
            <circle cx={X(0)} cy={Y(COG)} r="7" fill="#10291f" stroke={BRASS} strokeWidth="1.2" />
            <path
              d={`M${X(0)} ${Y(COG) - 7} A7 7 0 0 1 ${X(0) + 7} ${Y(COG)} L${X(0)} ${Y(COG)} Z M${X(0)} ${Y(COG) + 7} A7 7 0 0 1 ${X(0) - 7} ${Y(COG)} L${X(0)} ${Y(COG)} Z`}
              fill={BRASS}
            />
          </g>
        </g>

        {/* Near wheel, in front of the plates: 100 mm */}
        <g filter="url(#bp-shadow)">
          <circle
            cx={X(0)}
            cy={Y(AXLE)}
            r={50 * S}
            fill="#132f24"
            className="plot-fade"
            style={{ animationDelay: "600ms" }}
          />
        </g>
        <circle
          cx={X(0)}
          cy={Y(AXLE)}
          r={50 * S}
          fill="none"
          stroke={INK}
          strokeOpacity="0.85"
          strokeWidth="1.3"
          pathLength={1}
          className="plot"
        />
        <g className="plot-fade" style={{ animationDelay: "700ms" }} stroke={SAGE} fill="none">
          <circle cx={X(0)} cy={Y(AXLE)} r={42 * S} strokeOpacity="0.4" strokeDasharray="2 5" />
          <circle cx={X(0)} cy={Y(AXLE)} r={18 * S} strokeOpacity="0.7" />
          <circle cx={X(0)} cy={Y(AXLE)} r={3} fill={BRASS} stroke="none" />
        </g>

        {/* Axle centre line */}
        <line
          x1={X(-80)}
          y1={Y(AXLE)}
          x2={X(80)}
          y2={Y(AXLE)}
          stroke={SAGE}
          strokeOpacity="0.4"
          strokeDasharray="10 3 2 3"
          className="plot-fade"
          style={{ animationDelay: "500ms" }}
        />

        {/* Dimensions */}
        <g className="plot-fade" style={{ animationDelay: "1300ms" }}>
          <g stroke={SAGE}>
            {/* wheel diameter */}
            <line x1={X(-6)} y1={Y(0)} x2={X(-88)} y2={Y(0)} strokeOpacity="0.5" />
            <line x1={X(-6)} y1={Y(100)} x2={X(-88)} y2={Y(100)} strokeOpacity="0.5" />
            <line
              x1={X(-80)}
              y1={Y(0) - 2}
              x2={X(-80)}
              y2={Y(100) + 2}
              markerStart="url(#bp-arrow)"
              markerEnd="url(#bp-arrow)"
            />
            {/* plate depth */}
            <line x1={X(-50)} y1={Y(236)} x2={X(-50)} y2={Y(252)} strokeOpacity="0.5" />
            <line x1={X(50)} y1={Y(236)} x2={X(50)} y2={Y(252)} strokeOpacity="0.5" />
            <line
              x1={X(-50) + 2}
              y1={Y(247)}
              x2={X(50) - 2}
              y2={Y(247)}
              markerStart="url(#bp-arrow)"
              markerEnd="url(#bp-arrow)"
            />
            {/* CoG height above axle */}
            <line
              x1={X(10)}
              y1={Y(COG)}
              x2={X(88)}
              y2={Y(COG)}
              strokeOpacity="0.5"
              strokeDasharray="3 3"
            />
            <line x1={X(56)} y1={Y(AXLE)} x2={X(88)} y2={Y(AXLE)} strokeOpacity="0.5" />
            <line
              x1={X(80)}
              y1={Y(AXLE) - 2}
              x2={X(80)}
              y2={Y(COG) + 2}
              markerStart="url(#bp-arrow)"
              markerEnd="url(#bp-arrow)"
            />
          </g>
          <g className="font-mono" fontSize="11" fill={INK}>
            <rect
              x={X(-80) - 12}
              y={(Y(0) + Y(100)) / 2 - 20}
              width={24}
              height={40}
              fill="#1d4b39"
            />
            <text
              transform={`translate(${X(-80) + 4} ${(Y(0) + Y(100)) / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              Ø100
            </text>
            <rect x={X(0) - 14} y={Y(247) - 8} width={28} height={14} fill="#1d4b39" />
            <text x={X(0)} y={Y(247) + 4} textAnchor="middle">
              100
            </text>
            <rect
              x={X(80) - 12}
              y={(Y(AXLE) + Y(COG)) / 2 - 16}
              width={24}
              height={32}
              fill="#1d4b39"
            />
            <text
              transform={`translate(${X(80) + 4} ${(Y(AXLE) + Y(COG)) / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              108
            </text>
          </g>
        </g>

        {/* Leaders */}
        <g
          className="plot-fade font-mono"
          fontSize="9.5"
          fill={SAGE}
          style={{ animationDelay: "1500ms" }}
        >
          <Leader x1={X(-30)} y1={Y(220)} x2={X(-150)} y2={Y(222)} label="3S LiPo" />
          <Leader x1={X(-20)} y1={Y(141)} x2={X(-150)} y2={Y(160)} label="Arduino Mega" />
          <Leader x1={X(-40)} y1={Y(203)} x2={X(-150)} y2={Y(190)} label="230×100×6 acrylic" />
          <Leader x1={X(35)} y1={Y(143)} x2={X(150)} y2={Y(124)} label="MPU6500" end />
          <Leader
            x1={X(0) + 18 * S}
            y1={Y(AXLE) + 8}
            x2={X(150)}
            y2={Y(18)}
            label="12 V gear motor"
            end
          />
          <text x={X(92)} y={Y(COG) + 4} fill={BRASS}>
            CoG
          </text>
        </g>

        <text
          x={X(150)}
          y={Y(0) + 26}
          textAnchor="end"
          className="plot-fade font-mono"
          fontSize="9"
          letterSpacing="1.1"
          fill={SAGE}
          style={{ animationDelay: "1600ms" }}
        >
          SH-01 · NIDS · SIDE · mm
        </text>
      </svg>
    </button>
  );
}

function Leader({
  x1,
  y1,
  x2,
  y2,
  label,
  end = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  end?: boolean;
}) {
  const elbow = end ? x2 - 70 : x2 + 70;
  return (
    <g>
      <circle cx={x1} cy={y1} r="1.8" fill={BRASS} />
      <polyline
        points={`${x1},${y1} ${elbow},${y2} ${x2},${y2}`}
        fill="none"
        stroke={SAGE}
        strokeOpacity="0.7"
        strokeWidth="0.8"
      />
      <text x={x2} y={y2 - 4} textAnchor={end ? "end" : "start"}>
        {label}
      </text>
    </g>
  );
}
