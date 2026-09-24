import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";

/** Dark is the default theme of the design system; light is set with data-theme="light". */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} storageKey="theme" disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
