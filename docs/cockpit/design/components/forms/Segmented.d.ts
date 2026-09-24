export interface SegmentedProps { options: Array<string | { value: string; label: React.ReactNode }>; value?: string; onChange?: (v: string) => void; }
export declare function Segmented(props: SegmentedProps): JSX.Element;
