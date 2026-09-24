"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Pulse } from "./primitives";
import { css, sx } from "./style";
import { ToastProvider, useToast } from "./toast";

export type PaletteItem = { group: string; label: string; sub: string; href?: string; action?: "theme" | "stop" | "stopAll" | "stopDemos" | "syncCaptures"; model?: string };

/** What bench has running right now: agent runs and demo servers. */
export type Running = { runs: number; demos: number };

type StopAll = (kind?: "run" | "demo") => Promise<{ message: string }>;

export type LivePill = { model: string; progress: string; cost: string; running: boolean; href: string } | null;

const NAV = [
  { href: "/", label: "Accueil", match: (path: string) => path === "/" },
  { href: "/benchs", label: "Benchs", match: (path: string) => path.startsWith("/benchs") },
  { href: "/classement", label: "Classement", match: (path: string) => path.startsWith("/classement") },
  { href: "/runs", label: "Runs", match: (path: string) => path.startsWith("/runs") },
  { href: "/comparer", label: "Comparer", match: (path: string) => path.startsWith("/comparer") },
];

const noopSubscribe = () => () => {};

/** Resolved theme; "dark" during hydration since the server cannot know the stored choice. */
function useThemeName(): "dark" | "light" {
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return hydrated && resolvedTheme === "light" ? "light" : "dark";
}

function TopBar({ live, running, onOpenPalette, onStopAll }: { live: LivePill; running: Running; onOpenPalette: () => void; onStopAll: () => void }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const theme = useThemeName();
  return (
    <header style={css("position:sticky;top:0;z-index:20;border-bottom:1px solid var(--border);background:var(--bg)")}>
      <div style={css("max-width:1440px;margin:0 auto;height:56px;display:flex;align-items:center;gap:14px;padding:0 24px")}>
        <Link href="/" style={css("flex:none;display:flex;align-items:center;gap:9px;padding:0;border:0;background:none;color:var(--fg);cursor:pointer;white-space:nowrap;text-decoration:none")}>
          <span style={css("width:22px;height:22px;border-radius:5px;border:1px solid var(--border-strong);background:var(--surface-2);display:grid;place-items:center;font:700 10.5px/1 var(--mono)")}>mb</span>
          <span style={css("font:600 15px/1 var(--sans);letter-spacing:-.01em")}>model-bench</span>
        </Link>
        <nav style={css("flex:none;display:flex;align-items:center;gap:2px")}>
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                {...sx(
                  `display:inline-flex;align-items:center;height:32px;padding:0 10px;border:0;border-radius:6px;background:${active ? "var(--surface-2)" : "transparent"};color:${active ? "var(--fg)" : "var(--fg-2)"};font:500 13.5px/1 var(--sans);cursor:pointer;white-space:nowrap;text-decoration:none`,
                  "color:var(--fg);background:var(--surface-2)",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={onOpenPalette}
          {...sx(
            "margin-left:auto;flex:1 1 120px;max-width:270px;min-width:0;display:flex;align-items:center;gap:10px;height:34px;padding:0 8px 0 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--fg-3);font:400 13px/1 var(--sans);cursor:pointer;text-align:left",
            "border-color:var(--border-strong)",
          )}
        >
          <span style={css("flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>Rechercher modèles, benchs, runs…</span>
          <span style={css("padding:3px 6px;border:1px solid var(--border);border-radius:4px;font:500 11px/1 var(--mono);color:var(--fg-2)")}>⌘K</span>
        </button>
        {live ? (
          <Link
            href={live.href}
            {...sx(
              "flex:0 1 auto;min-width:0;overflow:hidden;display:flex;align-items:center;gap:8px;height:34px;padding:0 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--fg);font:500 12.5px/1 var(--mono);cursor:pointer;white-space:nowrap;text-decoration:none",
              "border-color:var(--border-strong)",
            )}
          >
            {live.running ? <Pulse /> : null}
            <span>{live.model}</span>
            <span style={css("color:var(--fg-3)")}>{live.progress}</span>
            <span style={css("color:var(--fg-2)")}>{live.cost}</span>
          </Link>
        ) : null}
        {running.runs + running.demos > 0 ? (
          <button
            onClick={onStopAll}
            title={`Arrêter ${running.runs} run${running.runs > 1 ? "s" : ""} et ${running.demos} démo${running.demos > 1 ? "s" : ""}`}
            {...sx(
              "flex:none;display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--fg-2);font:500 11.5px/1 var(--mono);cursor:pointer;white-space:nowrap",
              "color:var(--err);border-color:var(--err)",
            )}
          >
            <span style={css("width:7px;height:7px;background:currentColor;border-radius:1px")} />
            {running.runs + running.demos}
          </button>
        ) : null}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Changer de thème"
          {...sx(
            "flex:none;height:34px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--fg-2);font:500 11.5px/1 var(--mono);cursor:pointer",
            "color:var(--fg);border-color:var(--border-strong)",
          )}
        >
          {theme}
        </button>
        <Link
          href="/lancer"
          {...sx(
            "flex:none;display:inline-flex;align-items:center;height:34px;padding:0 14px;border:1px solid var(--primary);border-radius:8px;background:var(--primary);color:var(--primary-fg);font:600 13.5px/1 var(--sans);cursor:pointer;white-space:nowrap;text-decoration:none",
            "opacity:.88",
          )}
        >
          Lancer un run
        </Link>
      </div>
    </header>
  );
}

function Palette({
  items,
  onClose,
  onStop,
  onStopAll,
  onSyncCaptures,
}: {
  items: PaletteItem[];
  onClose: () => void;
  onStop: (model: string) => void;
  onStopAll: (kind?: "demo") => void;
  onSyncCaptures: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const theme = useThemeName();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = setTimeout(() => input.current?.focus(), 30);
    return () => clearTimeout(id);
  }, []);
  const withTheme = items.map((item) => (item.action === "theme" ? { ...item, label: `Thème ${theme === "dark" ? "clair" : "sombre"}` } : item));
  const q = query.trim().toLowerCase();
  const hits = withTheme.filter((item) => !q || `${item.label} ${item.sub} ${item.group}`.toLowerCase().includes(q)).slice(0, q ? 12 : 10);
  const run = (item: PaletteItem) => {
    onClose();
    if (item.action === "theme") setTheme(theme === "dark" ? "light" : "dark");
    else if (item.action === "stop" && item.model) onStop(item.model);
    else if (item.action === "stopAll") onStopAll();
    else if (item.action === "stopDemos") onStopAll("demo");
    else if (item.action === "syncCaptures") onSyncCaptures();
    else if (item.href) router.push(item.href);
  };
  const rows: ReactNode[] = [];
  let group = "";
  hits.forEach((item, index) => {
    if (item.group !== group) {
      rows.push(<div key={`h-${item.group}`} style={css("padding:9px 9px 5px;font:500 11px/1 var(--mono);color:var(--fg-3)")}>{item.group}</div>);
      group = item.group;
    }
    rows.push(
      <button
        key={`${item.group}-${item.label}-${index}`}
        onClick={() => run(item)}
        {...sx(
          `width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 9px;border:0;border-radius:6px;background:${index === 0 ? "var(--surface-2)" : "transparent"};color:var(--fg);font:400 13.5px/1.3 var(--mono);text-align:left;cursor:pointer`,
          "background:var(--surface-2)",
        )}
      >
        <span>{item.label}</span>
        <span style={css("font:400 11.5px/1 var(--mono);color:var(--fg-3)")}>{item.sub}</span>
      </button>,
    );
  });
  return (
    <>
      <div onClick={onClose} style={css("position:fixed;inset:0;z-index:60;background:var(--scrim)")} />
      <div style={css("position:fixed;z-index:61;top:14vh;left:50%;transform:translateX(-50%);width:min(620px,calc(100vw - 32px));background:var(--surface);border:1px solid var(--border-strong);border-radius:12px;box-shadow:var(--shadow);overflow:hidden")}>
        <div style={css("display:flex;align-items:center;gap:12px;padding:0 14px;border-bottom:1px solid var(--border)")}>
          <span style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>›</span>
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && hits[0]) run(hits[0]);
            }}
            placeholder="modèle, run, bench, action…"
            style={css("flex:1;height:50px;border:0;background:transparent;color:var(--fg);font:400 15px/1 var(--mono);outline:none")}
          />
          <span style={css("padding:3px 6px;border:1px solid var(--border);border-radius:4px;font:500 11px/1 var(--mono);color:var(--fg-3)")}>esc</span>
        </div>
        <div style={css("max-height:420px;overflow:auto;padding:5px")}>
          {rows}
          {hits.length === 0 ? <div style={css("padding:16px 9px;font:400 13px/1 var(--mono);color:var(--fg-3)")}>aucun résultat</div> : null}
        </div>
      </div>
    </>
  );
}

/** Top bar, ⌘K palette and toasts around every page. */
export function Shell({
  live,
  running,
  palette,
  onStop,
  onStopAll,
  onSyncCaptures,
  children,
}: {
  live: LivePill;
  running: Running;
  palette: PaletteItem[];
  onStop: (model: string) => Promise<{ message: string }>;
  onStopAll: StopAll;
  onSyncCaptures: () => Promise<{ message: string }>;
  children: ReactNode;
}) {
  return (
    <ToastProvider>
      <ShellInner live={live} running={running} palette={palette} onStop={onStop} onStopAll={onStopAll} onSyncCaptures={onSyncCaptures}>
        {children}
      </ShellInner>
    </ToastProvider>
  );
}

function ShellInner({
  live,
  running,
  palette,
  onStop,
  onStopAll,
  onSyncCaptures,
  children,
}: {
  live: LivePill;
  running: Running;
  palette: PaletteItem[];
  onStop: (model: string) => Promise<{ message: string }>;
  onStopAll: StopAll;
  onSyncCaptures: () => Promise<{ message: string }>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const router = useRouter();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const stopAll = async (kind?: "run" | "demo") => {
    toast(kind === "demo" ? "Arrêt des démos…" : "Arrêt de tous les runs et démos…");
    toast((await onStopAll(kind)).message);
    router.refresh();
  };
  return (
    <>
      <TopBar live={live} running={running} onOpenPalette={() => setOpen(true)} onStopAll={() => stopAll()} />
      {children}
      {open ? (
        <Palette
          items={palette}
          onClose={() => setOpen(false)}
          onStop={async (model) => {
            toast((await onStop(model)).message);
            router.refresh();
          }}
          onStopAll={stopAll}
          onSyncCaptures={async () => {
            toast((await onSyncCaptures()).message);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
