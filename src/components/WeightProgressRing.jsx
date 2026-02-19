import { useState, useEffect } from "react";
import { useAccent } from "../context/AccentContext";

// SVG circular progress ring for weight tracking.
//
// Props:
//   startWeight   — number | null  (first logged weight)
//   currentWeight — number | null  (most recent logged weight)
//   goalWeight    — number | null  (target weight from profile)
//   size          — number         (pixel size, default 160)
//
// Fill logic:
//   • If goalWeight is set: % = (start→current) / (start→goal), clamped 0–100
//   • Otherwise:            % = abs(change) / (start * 0.10), clamped 0–100
//     (i.e. full ring = 10% body-weight change)

const R = 42;
const CX = 50;
const CY = 50;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function WeightProgressRing({ startWeight, currentWeight, goalWeight, size = 160 }) {
  const { primary: accentPrimary } = useAccent();

  // Compute target percentage
  let targetPct = 0;
  let direction = "none"; // "loss" | "gain"

  if (startWeight != null && currentWeight != null) {
    const change = startWeight - currentWeight; // positive = loss
    if (change > 0.05)       direction = "loss";
    else if (change < -0.05) direction = "gain";

    if (goalWeight != null && Math.abs(startWeight - goalWeight) > 0.1) {
      const totalNeeded = Math.abs(startWeight - goalWeight);
      const done        = Math.abs(startWeight - currentWeight);
      targetPct = Math.min(100, Math.max(0, (done / totalNeeded) * 100));
    } else {
      // Show progress toward losing / gaining 10% of starting weight
      const tenPercent = startWeight * 0.10;
      targetPct = Math.min(100, Math.max(0, (Math.abs(change) / tenPercent) * 100));
    }
  }

  // Animate from 0 → targetPct on mount
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(targetPct), 80);
    return () => clearTimeout(t);
  }, [targetPct]);

  const strokeOffset = CIRCUMFERENCE - (CIRCUMFERENCE * animPct / 100);
  // Ring stroke always uses the gender-themed accent color.
  // Change-text below keeps semantic green/purple for readability.
  const ringColor = accentPrimary;

  // Human-readable change string (e.g. "-2.3 kg" or "+1.1 kg")
  const changeKg = startWeight != null && currentWeight != null
    ? (currentWeight - startWeight).toFixed(1)
    : null;
  const changeStr = changeKg != null
    ? (Number(changeKg) <= 0 ? `${changeKg} kg` : `+${changeKg} kg`)
    : null;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
      aria-label={`Weight: ${currentWeight ?? "—"} kg`}
    >
      {/* Background track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="var(--border)"
        strokeWidth="7"
      />

      {/* Progress arc */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={ringColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={strokeOffset}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1)" }}
      />

      {/* Current weight — center */}
      <text
        x="50" y="44"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="var(--text-primary)"
      >
        {currentWeight ?? "—"}
      </text>

      <text x="50" y="55" textAnchor="middle" fontSize="9" fill="var(--text-muted)">
        kg
      </text>

      {/* Change indicator */}
      {changeStr && (
        <text
          x="50" y="67"
          textAnchor="middle"
          fontSize="8.5"
          fill={direction === "loss" ? "#22c55e" : direction === "gain" ? "#818cf8" : "var(--text-muted)"}
        >
          {changeStr}
        </text>
      )}

      {/* Goal label */}
      {goalWeight && (
        <text x="50" y="78" textAnchor="middle" fontSize="7.5" fill="var(--text-muted)">
          goal {goalWeight}
        </text>
      )}
    </svg>
  );
}
