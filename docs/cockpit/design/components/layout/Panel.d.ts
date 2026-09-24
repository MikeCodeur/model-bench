/**
 * Bordered surface with optional header row.
 * @startingPoint section="Layout" subtitle="Card / panel with header" viewport="700x240"
 */
export interface PanelProps { title?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; padded?: boolean; style?: React.CSSProperties; }
export declare function Panel(props: PanelProps): JSX.Element;
