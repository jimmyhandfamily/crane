/**
 * Career stub — session-only progression (module state, no persistence).
 * Win beat: bump day rate + jobsCompleted for HUD pay tease.
 */

export type CareerRank = "Apprentice" | "Journeyman" | "Operator" | "Master";

export interface CareerState {
  rank: CareerRank;
  dayRate: number;
  jobsCompleted: number;
  unlockedYards: string[];
}

const INITIAL: CareerState = {
  rank: "Apprentice",
  dayRate: 0,
  jobsCompleted: 0,
  unlockedYards: ["training-yard"],
};

let state: CareerState = { ...INITIAL };

export function getCareerState(): Readonly<CareerState> {
  return state;
}

export function resetCareerStub(): void {
  state = { ...INITIAL };
}

/** Session win: bump day rate (+$120, or $0 → $240 on first), +1 job. Rank stays Apprentice. */
export function recordJobComplete(_jobId: string): void {
  const bump = state.dayRate === 0 ? 240 : 120;
  state = {
    ...state,
    jobsCompleted: state.jobsCompleted + 1,
    dayRate: state.dayRate + bump,
  };
}

export function getPayTeaseLabel(): string {
  return `Day rate: $${state.dayRate}`;
}
