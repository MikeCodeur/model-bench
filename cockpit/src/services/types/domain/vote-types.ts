/** A "Je préfère" pick on the compare screen. Candidates and preferred are attempt keys `model/run/test/attempt-n`. */
export type Vote = {
  test: string;
  candidates: string[];
  preferred: string;
  blind: boolean;
  at: string;
};
