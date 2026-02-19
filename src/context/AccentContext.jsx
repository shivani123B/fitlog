import { createContext, useContext, useEffect } from "react";

const AccentContext = createContext(null);

// ── Gender → accent palette mapping ──────────────────────────────────────────
//
// "primary"  — main accent color (buttons, rings, active icons)
// "hover"    — slightly darker, used on :hover states
// "soft"     — translucent tint for active nav background, badge fills
// "gradient" — rainbow string for "other" gender; null for solid palettes
//
const PALETTES = {
  female: {
    primary:  "#ec4899",
    hover:    "#db2777",
    soft:     "rgba(236, 72, 153, 0.15)",
    gradient: null,
  },
  male: {
    primary:  "#3b82f6",
    hover:    "#2563eb",
    soft:     "rgba(59, 130, 246, 0.15)",
    gradient: null,
  },
  // "other" gets a subtle rainbow gradient on specific elements only.
  // We keep a solid purple as `primary` for SVG/text uses (can't gradient those easily).
  other: {
    primary:  "#8b5cf6",
    hover:    "#7c3aed",
    soft:     "rgba(139, 92, 246, 0.15)",
    gradient: "linear-gradient(90deg, #f43f5e, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)",
  },
  "prefer not to say": {
    primary:  "#b45309",
    hover:    "#92400e",
    soft:     "rgba(180, 83, 9, 0.13)",
    gradient: null,
  },
};

// Fallback when no user is logged in or gender is unknown
const DEFAULT_PALETTE = {
  primary:  "#6366f1",
  hover:    "#4f46e5",
  soft:     "rgba(99, 102, 241, 0.15)",
  gradient: null,
};

// Normalise the gender string coming from the profile (e.g. "Female", "Male",
// "Other", "Prefer not to say") to a lookup key.
function getPalette(gender) {
  if (!gender) return DEFAULT_PALETTE;
  const key = gender.toLowerCase().trim();
  return PALETTES[key] ?? DEFAULT_PALETTE;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AccentProvider({ children, activeUser }) {
  // Derive the current gender string from the active user's profile.
  const gender = activeUser?.profile?.gender ?? null;

  useEffect(() => {
    const palette = getPalette(gender);
    const b = document.body;

    // Inline styles on <body> have higher CSS specificity than class-based
    // custom properties (set by ThemeContext on body.theme-light / .theme-dark),
    // so these values will override the default indigo accent in both themes
    // while all other theme variables (bg-card, text-primary, etc.) remain unchanged.
    b.style.setProperty("--accent",          palette.primary);
    b.style.setProperty("--accent-hover",    palette.hover);
    b.style.setProperty("--accent-light",    palette.soft);

    // Sidebar vars use the same accent values so the active nav pill matches.
    b.style.setProperty("--sidebar-active",  palette.soft);
    b.style.setProperty("--sidebar-accent",  palette.primary);

    // Gradient var: used by CSS gradient-mode rules below (index.css).
    b.style.setProperty("--accent-gradient", palette.gradient ?? palette.primary);

    // Mark the body so CSS can target gradient-only elements specifically.
    if (palette.gradient) {
      b.setAttribute("data-accent-gradient", "true");
    } else {
      b.removeAttribute("data-accent-gradient");
    }

    // Cleanup: remove overrides when the user logs out (provider re-renders
    // with activeUser = null, gender = null, which triggers this cleanup).
    return () => {
      b.style.removeProperty("--accent");
      b.style.removeProperty("--accent-hover");
      b.style.removeProperty("--accent-light");
      b.style.removeProperty("--sidebar-active");
      b.style.removeProperty("--sidebar-accent");
      b.style.removeProperty("--accent-gradient");
      b.removeAttribute("data-accent-gradient");
    };
  }, [gender]); // re-run only when gender string changes

  return (
    <AccentContext.Provider value={getPalette(gender)}>
      {children}
    </AccentContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

// Returns the current accent palette object: { primary, hover, soft, gradient }.
// Falls back to the default indigo palette if used outside an AccentProvider.
export function useAccent() {
  return useContext(AccentContext) ?? DEFAULT_PALETTE;
}
