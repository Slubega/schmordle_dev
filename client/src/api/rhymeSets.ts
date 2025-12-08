import type { RhymeSet } from "../interfaces/types";
import rhymeSets from "../data/rhymeSets.json";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

const getLocalRhymeSet = (id: string): RhymeSet | undefined => {
  const sets = rhymeSets as RhymeSet[];
  return sets.find((s) => s.id === id);
};

export async function fetchRhymeSet(id: string): Promise<RhymeSet> {
  const local = getLocalRhymeSet(id);

  // Always try the backend if an API base is configured
  if (API_BASE) {
    try {
      const base = API_BASE.replace(/\/$/, "");
      const res = await fetch(`${base}/rhymeSet/${id}`);
      if (res.ok) {
        return res.json();
      }
    } catch {
      // ignore network errors and fall back to local
    }
  }

  if (local) return local;

  throw new Error("Failed to fetch rhyme set");
}
