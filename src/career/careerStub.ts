/**
 * Career stub module (Milestone 0).
 * No real progression — placeholder API for later milestones.
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

/** Stub — does nothing meaningful in M0. */
export function recordJobComplete(_jobId: string): void {
  // Progression wired in a later milestone
  state = {
    ...state,
    jobsCompleted: state.jobsCompleted + 0, // intentional no-op bump
  };
}

export function getPayTeaseLabel(): string {
  return `Day rate: $${state.dayRate}`;
}
