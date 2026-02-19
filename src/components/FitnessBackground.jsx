export default function FitnessBackground() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(0.3px)",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="fitness-bg-pattern"
          x="0"
          y="0"
          width="760"
          height="520"
          patternUnits="userSpaceOnUse"
        >
          {/* All icons share the fitness-bg-icon class for theme-aware stroke */}

          {/* ── 1. Dumbbell (top-left) ── */}
          <g className="fitness-bg-icon" transform="translate(25, 20) rotate(-14, 18, 13)">
            {/* left weight plates */}
            <rect x="0" y="3" width="5" height="20" rx="2" />
            <rect x="5" y="6" width="4" height="14" rx="1.5" />
            {/* right weight plates */}
            <rect x="27" y="6" width="4" height="14" rx="1.5" />
            <rect x="31" y="3" width="5" height="20" rx="2" />
            {/* bar */}
            <line x1="9" y1="13" x2="27" y2="13" />
          </g>

          {/* ── 2. Apple (top area) ── */}
          <g className="fitness-bg-icon" transform="translate(196, 38) rotate(7, 18, 24)">
            {/* stem */}
            <path d="M18 7 Q19 3 22 2" />
            {/* leaf */}
            <path d="M19 6 Q24 4 24 9 Q21 8 19 6Z" />
            {/* body */}
            <path d="M10 15 C9 24 13 34 18 35 C23 34 27 24 26 15 C24 10 21 9 18 11 C15 9 12 10 10 15Z" />
          </g>

          {/* ── 3. Water bottle (top center-right) ── */}
          <g className="fitness-bg-icon" transform="translate(370, 10) rotate(-8, 14, 22)">
            {/* cap */}
            <rect x="9" y="0" width="10" height="6" rx="2" />
            {/* neck */}
            <line x1="9" y1="6" x2="7" y2="10" />
            <line x1="19" y1="6" x2="21" y2="10" />
            {/* body */}
            <rect x="5" y="10" width="18" height="30" rx="4" />
            {/* water level wavy line */}
            <path d="M7 30 Q10 27 14 30 Q18 33 21 30" />
          </g>

          {/* ── 4. Kettlebell (top right area) ── */}
          <g className="fitness-bg-icon" transform="translate(552, 14) rotate(10, 20, 24)">
            {/* ball */}
            <circle cx="20" cy="30" r="14" />
            {/* handle arc */}
            <path d="M12 23 Q12 8 20 8 Q28 8 28 23" />
            {/* handle end caps */}
            <line x1="10" y1="23" x2="14" y2="23" />
            <line x1="26" y1="23" x2="30" y2="23" />
          </g>

          {/* ── 5. Checklist (top far-right) ── */}
          <g className="fitness-bg-icon" transform="translate(706, 10) rotate(-5, 16, 20)">
            {/* paper */}
            <rect x="2" y="0" width="26" height="36" rx="3" />
            {/* row 1: checkbox + line */}
            <rect x="6" y="6" width="7" height="7" rx="1.5" />
            <polyline points="7,9.5 9,12 12,7.5" />
            <line x1="17" y1="9.5" x2="25" y2="9.5" />
            {/* row 2 */}
            <rect x="6" y="17" width="7" height="7" rx="1.5" />
            <polyline points="7,20.5 9,23 12,18.5" />
            <line x1="17" y1="20.5" x2="25" y2="20.5" />
            {/* row 3 (unchecked) */}
            <rect x="6" y="28" width="7" height="7" rx="1.5" />
            <line x1="17" y1="31.5" x2="25" y2="31.5" />
          </g>

          {/* ── 6. Heart-pulse / ECG (mid-left) ── */}
          <g className="fitness-bg-icon" transform="translate(52, 232)">
            <polyline points="0,16 10,16 15,4 21,29 27,8 33,20 40,20 50,16 60,16" />
          </g>

          {/* ── 7. Salad bowl (mid-center) ── */}
          <g className="fitness-bg-icon" transform="translate(265, 218) rotate(4, 22, 25)">
            {/* bowl */}
            <path d="M4 20 Q4 38 22 38 Q40 38 40 20" />
            {/* rim */}
            <line x1="2" y1="20" x2="42" y2="20" />
            {/* greens / leaves */}
            <path d="M12 18 Q10 10 17 10 Q16 15 12 18Z" />
            <path d="M22 17 Q21 8 28 9 Q26 14 22 17Z" />
            <path d="M32 18 Q33 10 38 12 Q35 16 32 18Z" />
          </g>

          {/* ── 8. Running shoe (mid-right) ── */}
          <g className="fitness-bg-icon" transform="translate(466, 214) rotate(7, 26, 18)">
            {/* upper */}
            <path d="M4 22 Q4 10 14 8 Q22 6 30 10 Q38 13 44 22" />
            {/* sole */}
            <path d="M2 26 Q2 30 10 30 L44 30 Q50 30 50 26 Q50 22 44 22 L4 22 Q2 22 2 26Z" />
            {/* heel bump */}
            <path d="M2 26 Q0 24 2 22" />
            {/* laces */}
            <line x1="14" y1="16" x2="28" y2="14" />
            <line x1="16" y1="20" x2="30" y2="18" />
            <line x1="12" y1="12" x2="24" y2="10" />
          </g>

          {/* ── 9. Broccoli (mid far-right) ── */}
          <g className="fitness-bg-icon" transform="translate(654, 214) rotate(-5, 20, 28)">
            {/* florets */}
            <circle cx="20" cy="10" r="7" />
            <circle cx="11" cy="18" r="6" />
            <circle cx="29" cy="18" r="6" />
            {/* stems */}
            <line x1="20" y1="17" x2="20" y2="38" />
            <line x1="14" y1="23" x2="20" y2="32" />
            <line x1="26" y1="23" x2="20" y2="32" />
          </g>

          {/* ── 10. Measuring tape (lower-left area) ── */}
          <g className="fitness-bg-icon" transform="translate(158, 414) rotate(14, 24, 12)">
            {/* tape body */}
            <rect x="0" y="4" width="48" height="16" rx="4" />
            {/* tick marks */}
            <line x1="8"  y1="12" x2="8"  y2="4"  />
            <line x1="16" y1="12" x2="16" y2="6"  />
            <line x1="24" y1="12" x2="24" y2="4"  />
            <line x1="32" y1="12" x2="32" y2="6"  />
            <line x1="40" y1="12" x2="40" y2="4"  />
          </g>

          {/* ── 11. Dumbbell again (lower-center) ── */}
          <g className="fitness-bg-icon" transform="translate(422, 412) rotate(35, 18, 13)">
            <rect x="0" y="3" width="5" height="20" rx="2" />
            <rect x="5" y="6" width="4" height="14" rx="1.5" />
            <rect x="27" y="6" width="4" height="14" rx="1.5" />
            <rect x="31" y="3" width="5" height="20" rx="2" />
            <line x1="9" y1="13" x2="27" y2="13" />
          </g>

          {/* ── 12. Apple again (lower-right) ── */}
          <g className="fitness-bg-icon" transform="translate(622, 420) rotate(-10, 18, 24)">
            <path d="M18 7 Q19 3 22 2" />
            <path d="M19 6 Q24 4 24 9 Q21 8 19 6Z" />
            <path d="M10 15 C9 24 13 34 18 35 C23 34 27 24 26 15 C24 10 21 9 18 11 C15 9 12 10 10 15Z" />
          </g>

        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#fitness-bg-pattern)" />
    </svg>
  );
}
