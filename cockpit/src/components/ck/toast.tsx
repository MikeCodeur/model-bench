"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { css } from "./style";

const ToastContext = createContext<(message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

/** Bottom-right toast of the mockup, 2.6 s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 2600);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <div style={css("position:fixed;right:20px;bottom:20px;z-index:70;display:flex;align-items:center;gap:10px;padding:11px 14px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--fg);font:400 13px/1.3 var(--mono);box-shadow:var(--shadow)")}>
          <span style={css("width:7px;height:7px;border-radius:50%;background:var(--accent)")} />
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
