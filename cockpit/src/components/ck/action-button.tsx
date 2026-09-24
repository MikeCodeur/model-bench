"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/app/action-result";
import type { StyleProps } from "./style";
import { useToast } from "./toast";

/** A mockup button bound to a server action: toast the outcome, then follow the returned link or refresh. */
export function ActionButton({
  action,
  children,
  title,
  disabled,
  ...styleProps
}: StyleProps & { action: () => Promise<ActionResult>; children: ReactNode; title?: string; disabled?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <button
      {...styleProps}
      title={title}
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          toast(result.message);
          if (result.success && result.href) router.push(result.href);
          else router.refresh();
        })
      }
    >
      {children}
    </button>
  );
}
