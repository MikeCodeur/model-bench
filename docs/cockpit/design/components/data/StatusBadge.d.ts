/**
 * Result state badge — the 7 run states + optional version tag.
 * @startingPoint section="Data" subtitle="Run/result state badges" viewport="700x160"
 */
export interface StatusBadgeProps { status: 'pending' | 'running' | 'done' | 'nostart' | 'error' | 'timeout' | 'stopped'; label?: string; version?: string; }
export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;
