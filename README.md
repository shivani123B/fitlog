# FitLog

A frontend-only daily fitness log built with React + Vite.
Data is stored in `localStorage`; no backend required.

## Nutrition API setup

Meal items are looked up via a 3-tier system:

| Tier | Source | Key needed? |
|------|--------|-------------|
| 1 — Auto (Generic) | [USDA FoodData Central](https://fdc.nal.usda.gov/) | Optional (free) |
| 2 — Packaged (OFF) | [Open Food Facts](https://world.openfoodfacts.org/) | No |
| 3 — Manual | User entry | — |

### Getting a free USDA API key

Without a key the app uses `DEMO_KEY` (30 requests/hour per IP), which is
fine for personal use. For higher limits:

1. Sign up at <https://fdc.nal.usda.gov/api-key-signup.html> (free, instant).
2. Create a `.env` file in the project root:

```
VITE_NUTRITION_API_KEY=your_key_here
```

3. Restart the dev server (`npm run dev`).

> `.env` is in `.gitignore` — your key will never be committed.

---

# React + Vite (original template notes)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
