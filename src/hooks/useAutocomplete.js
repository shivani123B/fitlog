import { useState, useEffect, useRef } from "react";

// ── Module-level result cache ─────────────────────────────────────────────────
// Persists across remounts so repeated queries don't hit the network again.
// Key = "<mode>:<queryLowerCase>", max 50 entries (oldest evicted first).

const cache = new Map();
const CACHE_MAX = 50;

function cacheSet(key, value) {
  if (cache.has(key)) cache.delete(key); // refresh insertion order (LRU)
  cache.set(key, value);
  if (cache.size > CACHE_MAX) {
    cache.delete(cache.keys().next().value); // evict oldest
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Typeahead autocomplete hook with debouncing, caching, and stale-request guard.
 *
 * @param {object} opts
 * @param {string}        opts.query       — current input text
 * @param {string}        opts.mode        — "generic" | "off" (namespaces cache)
 * @param {Function|null} opts.fetcher     — async (q: string) => Array; null = disabled
 * @param {number}        [opts.minChars=2]    — minimum chars before fetching
 * @param {number}        [opts.debounceMs=300] — debounce delay in ms
 *
 * @returns {{ results, loading, error, open, setOpen, highlightedIndex, setHighlightedIndex }}
 */
export function useAutocomplete({
  query,
  mode,
  fetcher,
  minChars   = 2,
  debounceMs = 300,
}) {
  const [results,          setResults]          = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState(false);
  const [open,             setOpen]             = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Stale-request guard: incremented on every new fetch; ignored if stale.
  const reqIdRef   = useRef(0);
  // Keep fetcher in a ref so the effect doesn't need it as a dependency.
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; }, [fetcher]);

  useEffect(() => {
    const q = query.trim();

    // Not enough chars or fetching disabled — reset and close.
    if (!fetcherRef.current || q.length < minChars) {
      setResults([]);
      setLoading(false);
      setError(false);
      setOpen(false);
      return;
    }

    // Cache hit — instant result, no loading indicator needed.
    const cacheKey = `${mode}:${q.toLowerCase()}`;
    if (cache.has(cacheKey)) {
      setResults(cache.get(cacheKey));
      setError(false);
      setLoading(false);
      setOpen(true);
      return;
    }

    // Debounce the actual network request.
    const reqId = ++reqIdRef.current;

    const timer = setTimeout(async () => {
      // Show dropdown with loading indicator as soon as debounce fires.
      setLoading(true);
      setResults([]);
      setOpen(true);

      try {
        const data = await fetcherRef.current(q);
        if (reqId !== reqIdRef.current) return; // stale — another request is in flight

        const limited = (data || []).slice(0, 8);
        cacheSet(cacheKey, limited);
        setResults(limited);
        setError(false);
      } catch {
        if (reqId !== reqIdRef.current) return;
        setResults([]);
        setError(true);
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, mode, minChars, debounceMs]); // fetcher is stable via ref

  // Reset keyboard highlight whenever the results list changes.
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  return { results, loading, error, open, setOpen, highlightedIndex, setHighlightedIndex };
}
