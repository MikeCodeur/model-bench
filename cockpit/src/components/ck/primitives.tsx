import type { DisplayState } from "@/services/types/domain/attempt-types";
import { ST } from "./status";
import { css } from "./style";

/** The blue running dot (mockup `pulse`). */
export function Pulse() {
  return (
    <span
      style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ring)", flex: "none", display: "inline-block", animation: "ckpulse 1.4s ease-in-out infinite" }}
    />
  );
}

/** Status badge as drawn in cards, compare slots and the result aside (gap 5px, padding 0 7px). */
export function StatusBadge({ state }: { state: DisplayState }) {
  const st = ST[state];
  return (
    <span style={css(`display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 7px;border-radius:5px;border:1px ${st.bs} ${st.bd};background:${st.bg};color:${st.fg};font:500 11.5px/1 var(--mono);white-space:nowrap`)}>
      <span>{st.g}</span>
      {st.label}
    </span>
  );
}

/** Background of a thumbnail: the attempt's capture, or the demo black. */
export const thumbBackground = (url: string | null) => (url ? `url('${url}') center / cover no-repeat, #030304` : "var(--surface-2)");
