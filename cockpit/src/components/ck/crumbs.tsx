"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { css, sx } from "./style";

export type CrumbOption = { label: string; sub: string; href: string; active: boolean };
export type Crumb = { label: string; href?: string; menuTitle?: string; options?: CrumbOption[] };

/** Breadcrumb row of the mockup: every level with options opens a dropdown of its siblings. */
export function Crumbs({ items }: { items: Crumb[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(-1);
  const all: Crumb[] = [{ label: "cockpit", href: "/" }, ...items];
  return (
    <div style={css("position:relative;display:flex;align-items:center;min-height:32px;margin-bottom:18px")}>
      {open >= 0 ? <div onClick={() => setOpen(-1)} style={css("position:fixed;inset:0;z-index:30")} /> : null}
      {all.map((crumb, index) => {
        const hasMenu = Boolean(crumb.options?.length);
        const isOpen = open === index && hasMenu;
        const last = index === all.length - 1;
        return (
          <div key={`${crumb.label}-${index}`} style={css("position:relative;display:flex;align-items:center;z-index:35")}>
            {index > 0 ? <span style={css("padding:0 4px;color:var(--fg-3);font:400 14px/1 var(--mono)")}>/</span> : null}
            <button
              onClick={() => (hasMenu ? setOpen(isOpen ? -1 : index) : crumb.href && router.push(crumb.href))}
              {...sx(
                `display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border:1px solid ${hasMenu ? "var(--border)" : "transparent"};border-radius:6px;background:${isOpen ? "var(--surface-2)" : "transparent"};color:${last ? "var(--fg)" : "var(--fg-2)"};font:500 13px/1 var(--mono);cursor:pointer;white-space:nowrap`,
                "background:var(--surface-2);color:var(--fg)",
              )}
            >
              <span>{crumb.label}</span>
              {hasMenu ? <span style={css("font-size:8px;color:var(--fg-3)")}>▼</span> : null}
            </button>
            {isOpen ? (
              <div style={css("position:absolute;top:34px;left:0;z-index:40;min-width:320px;max-height:380px;overflow:auto;padding:5px;background:var(--surface);border:1px solid var(--border-strong);border-radius:8px;box-shadow:var(--shadow)")}>
                <div style={css("padding:7px 9px;font:500 11px/1 var(--mono);color:var(--fg-3)")}>{crumb.menuTitle}</div>
                {crumb.options!.map((option) => (
                  <Fragment key={option.href + option.label}>
                    <button
                      onClick={() => {
                        setOpen(-1);
                        router.push(option.href);
                      }}
                      {...sx(
                        `width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:7px 9px;border:0;border-radius:5px;background:${option.active ? "var(--surface-2)" : "transparent"};color:var(--fg);font:500 13px/1.3 var(--mono);text-align:left;cursor:pointer`,
                        "background:var(--surface-2)",
                      )}
                    >
                      <span>{option.label}</span>
                      <span style={css("font:400 11.5px/1 var(--mono);color:var(--fg-3);white-space:nowrap")}>{option.sub}</span>
                    </button>
                  </Fragment>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
