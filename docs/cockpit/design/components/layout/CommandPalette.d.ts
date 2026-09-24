export interface CommandPaletteProps { query?: string; onQuery?: (q: string) => void; groups: Array<{ label: string; items: Array<{ label: string; hint?: string; onSelect?: () => void }> }>; }
export declare function CommandPalette(props: CommandPaletteProps): JSX.Element;
