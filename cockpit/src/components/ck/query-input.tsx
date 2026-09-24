"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { css } from "./style";

/** Text filter kept in the URL (`?q=`), so the server filters and the view stays shareable. */
export function QueryInput({ placeholder, style }: { placeholder: string; style: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  return (
    <input
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        const next = new URLSearchParams(params);
        if (event.target.value) next.set("q", event.target.value);
        else next.delete("q");
        router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
      }}
      placeholder={placeholder}
      style={css(style)}
    />
  );
}
