export interface TabsProps { tabs: Array<string | { value: string; label: React.ReactNode }>; value?: string; onChange?: (v: string) => void; }
export declare function Tabs(props: TabsProps): JSX.Element;
