import type { ReactNode } from "react";

/**
 * Ink-stamp emblems, one per card, drawn for this project (no third-party art, so nothing to
 * license; SAFE-05). 32×32 viewBox, stroked in currentColor so tokens take their side's ink.
 */
const ART: Record<string, ReactNode> = {
  ib_recruit: (
    <>
      <circle cx="16" cy="16" r="11" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <path d="M16 5v8M16 19v8M5 16h8M19 16h8" />
    </>
  ),
  ib_footman: (
    <>
      <path d="M16 3l3 4v13h-6V7z" />
      <path d="M9 20h14M16 20v6" />
      <circle cx="16" cy="28" r="1.6" fill="currentColor" />
    </>
  ),
  ib_vanguard: (
    <>
      <path d="M7 6h18v8c0 7-4.5 11-9 13-4.5-2-9-6-9-13z" />
      <path d="M11 11l5 5 5-5M11 16l5 5 5-5" />
    </>
  ),
  ib_crossbow: (
    <>
      <path d="M4 13q12-9 24 0" />
      <path d="M4 13l12 5 12-5" />
      <path d="M16 9v19M12 28h8" />
      <path d="M13 9l3-5 3 5" fill="currentColor" />
    </>
  ),
  ib_breaker: (
    <>
      <rect x="6" y="5" width="20" height="9" rx="1.5" />
      <path d="M10 5v9M22 5v9M16 14v14" />
      <path d="M13 28h6" />
    </>
  ),
  ib_tower: (
    <>
      <path d="M9 28V11h14v17" />
      <path d="M8 11V6h3v2.5h2.5V6h5v2.5H21V6h3v5z" />
      <path d="M14 28v-5a2 2 0 014 0v5M16 14v3M6 28h20" />
    </>
  ),
  ib_wall: (
    <>
      <rect x="4" y="8" width="24" height="17" rx="1" />
      <path d="M4 14h24M4 20h24M11 8v6M21 8v6M7 14v6M16 14v6M25 14v6M11 20v5M21 20v5" />
    </>
  ),
  ib_spear: (
    <>
      <path d="M7 28L23 7" />
      <path d="M23 7l4-5-1.2 6.4z" fill="currentColor" />
      <path d="M20.5 10.5q-4.5-1-3.5 3.5" />
      <path d="M9 23l3 2" />
    </>
  ),
  vd_sprout: (
    <>
      <path d="M16 28V15M10 28h12" />
      <path d="M16 19c-6 0-8.5-4-8.5-8.5 5.5 0 8.5 3 8.5 8.5z" />
      <path d="M16 15.5c0-5.5 3-9.5 9-9.5 0 5.5-3 9.5-9 9.5z" />
    </>
  ),
  vd_thorn: (
    <>
      <path d="M4 25q12-17 24 0z" />
      <path d="M8.5 18l-2.5-4M12.5 14l-1-5M17 12.5l1-5.5M21.5 14.5l3-4.5M25 19l4-2" />
      <circle cx="25" cy="22.5" r="1" fill="currentColor" />
    </>
  ),
  vd_barkhide: (
    <>
      <path d="M10 28V12q6-7 12 0v16z" />
      <path d="M14 14v11M18 15v9M10 28l-4 1M22 28l4 1" />
      <ellipse cx="16" cy="21" rx="1.6" ry="2.2" />
    </>
  ),
  vd_archer: (
    <>
      <path d="M10 3q13 13 0 26M10 3v26" />
      <path d="M5 16h17" />
      <path d="M27 16l-5-3.5v7z" fill="currentColor" />
      <path d="M5 16l-2-3M5 16l-2 3" />
    </>
  ),
  vd_stag: (
    <>
      <path d="M12.5 17q3.5 12 7 0z" />
      <path d="M12.5 17c-3.5-3-5.5-7.5-4.5-13M10.5 11l-4.5-2M9.5 7l-3.5-1" />
      <path d="M19.5 17c3.5-3 5.5-7.5 4.5-13M21.5 11l4.5-2M22.5 7l3.5-1" />
    </>
  ),
  vd_treant: (
    <>
      <path d="M16 3c-7.5 0-10.5 5-9.5 10 1 4.5 5 6 9.5 6s8.5-1.5 9.5-6c1-5-2-10-9.5-10z" />
      <path d="M13 19v9h6v-9M9 28h14" />
      <circle cx="13" cy="11.5" r="1.2" fill="currentColor" />
      <circle cx="19" cy="11.5" r="1.2" fill="currentColor" />
      <path d="M13.5 15q2.5 2 5 0" />
    </>
  ),
  vd_forest: (
    <>
      <path d="M16 3l-7.5 11h4.5l-5.5 9h17l-5.5-9h4.5z" />
      <path d="M16 23v6" />
    </>
  ),
  vd_grove: (
    <>
      <path d="M9 6l-5 8h3l-3.5 6h11l-3.5-6h3z" />
      <path d="M23 6l-5 8h3l-3.5 6h11l-3.5-6h3z" />
      <path d="M16 11l-5 8h3l-3.5 6h11l-3.5-6h3z" />
      <path d="M9 20v4M23 20v4M16 25v4" />
    </>
  ),
};

export function CardArt({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      className={className ?? "art"}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ART[id] ?? <circle cx="16" cy="16" r="10" />}
    </svg>
  );
}

export const hasArt = (id: string) => id in ART;
