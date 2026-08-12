import type { ComponentPropsWithoutRef } from "react";

type AccessiblePreProps = ComponentPropsWithoutRef<"pre">;

/**
 * MDX kod ve formül bloklarını klavyeyle yatay kaydırılabilir yapar.
 * `region` adı, ekran okuyucu kullanıcısına odak durağının ne olduğunu söyler.
 */
export function AccessiblePre({ children, "aria-label": ariaLabel, ...props }: AccessiblePreProps) {
  return (
    <pre
      {...props}
      tabIndex={0}
      role="region"
      aria-label={ariaLabel ?? "Kod veya formül bloğu"}
    >
      {children}
    </pre>
  );
}
