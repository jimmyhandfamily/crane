/**
 * Career stub — progression with localStorage persist (pay, lessons, title).
 * Win beat: bump day rate + jobsCompleted for HUD pay tease.
 */

export type CareerRank = "Apprentice" | "Journeyman" | "Operator" | "Master";

export interface CareerState {
  rank: CareerRank;
  dayRate: number;
  jobsCompleted: number;
  unlockedYards: string[];
  /** Yard / HUD title (persisted). */
  title: string;
  lesson1Complete: boolean;
  lesson2Complete: boolean;
  /** Cumulative: a crate has been placed on Pad A / B this career save. */
  padAPlaced: boolean;
  padBPlaced: boolean;
}

const STORAGE_KEY = "crane.career.v1";

const INITIAL: CareerState = {
  rank: "Apprentice",
  dayRate: 0,
  jobsCompleted: 0,
  unlockedYards: ["training-yard"],
  title: "Training Yard",
  lesson1Complete: false,
  lesson2Complete: false,
  padAPlaced: false,
  padBPlaced: false,
};

function loadPersisted(): CareerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...INITIAL, unlockedYards: [...INITIAL.unlockedYards] };
    }
    const parsed = JSON.parse(raw) as Partial<CareerState>;
    return {
      rank: (parsed.rank as CareerRank) || INITIAL.rank,
      dayRate: typeof parsed.dayRate === "number" ? parsed.dayRate : 0,
      jobsCompleted:
        typeof parsed.jobsCompleted === "number" ? parsed.jobsCompleted : 0,
      unlockedYards: Array.isArray(parsed.unlockedYards)
        ? [...parsed.unlockedYards]
        : [...INITIAL.unlockedYards],
      title: typeof parsed.title === "string" ? parsed.title : INITIAL.title,
      lesson1Complete: !!parsed.lesson1Complete,
      lesson2Complete: !!parsed.lesson2Complete,
      padAPlaced: !!parsed.padAPlaced,
      padBPlaced: !!parsed.padBPlaced,
    };
  } catch {
    return { ...INITIAL, unlockedYards: [...INITIAL.unlockedYards] };
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — ignore */
  }
}

let state: CareerState = loadPersisted();

export function getCareerState(): Readonly<CareerState> {
  return state;
}

export function resetCareerStub(): void {
  state = { ...INITIAL, unlockedYards: [...INITIAL.unlockedYards] };
  persist();
}

export function setCareerTitle(title: string): void {
  state = { ...state, title };
  persist();
}

/** Mark pad A/B crate placement; returns whether flags changed. */
export function recordPadCratePlaced(padLabel: string): boolean {
  let changed = false;
  if (padLabel === "Pad A" && !state.padAPlaced) {
    state = { ...state, padAPlaced: true };
    changed = true;
  }
  if (padLabel === "Pad B" && !state.padBPlaced) {
    state = { ...state, padBPlaced: true };
    changed = true;
  }
  if (changed) persist();
  return changed;
}

/** Win: bump day rate (+$120, or $0 → $240 on first), +1 job. Rank stays Apprentice. */
export function recordJobComplete(jobId: string): void {
  const bump = state.dayRate === 0 ? 240 : 120;
  const next: CareerState = {
    ...state,
    jobsCompleted: state.jobsCompleted + 1,
    dayRate: state.dayRate + bump,
  };
  if (jobId === "training-yard-lesson-1") {
    next.lesson1Complete = true;
    if (!next.title || next.title === "Training Yard") {
      next.title = "Training Yard — Lesson 2";
    }
  }
  if (jobId === "training-yard-lesson-2") {
    next.lesson2Complete = true;
    next.title = "Training Yard — Graduated";
  }
  state = next;
  persist();
}

export function getPayTeaseLabel(): string {
  return `Day rate: $${state.dayRate}`;
}
