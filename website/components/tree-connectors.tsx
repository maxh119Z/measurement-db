"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   TreeConnectors — the elbows from the root to each band label.

   The only client code on this page, and it is here because the
   geometry cannot be expressed in CSS: every leaf is a <details>,
   so a band's vertical position changes whenever one is opened,
   and a line aimed at the root has to know both positions. So
   the paths are measured from the DOM and redrawn on resize and
   on every open/close.

   Below `lg` the tree is a single column and there is nothing to
   connect, so it draws nothing.
   ============================================================ */

export function TreeConnectors() {
  const ref = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;

    const measure = () => {
      if (window.innerWidth < 1024) {
        setPaths([]);
        return;
      }
      const root = host.querySelector("[data-tree-root]");
      if (!root) return;
      const box = host.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      const y1 = r.top + r.height / 2 - box.top;

      const next: string[] = [];
      for (const side of ["left", "right"] as const) {
        const els = [
          ...host.querySelectorAll(`[data-tree-band="${side}"]`),
        ];
        els.forEach((el, i) => {
          const b = el.getBoundingClientRect();
          const right = side === "right";
          const x1 = (right ? r.right : r.left) - box.left;
          const x2 = (right ? b.left : b.right) - box.left;
          const y2 = b.top + b.height / 2 - box.top;
          // Each band turns at its own x. Sharing one midpoint stacks every
          // vertical segment into a single trunk, which reads as the bands
          // meeting a centre line rather than the root.
          const t = els.length === 1 ? 0.5 : 0.28 + (0.48 * i) / (els.length - 1);
          const mx = x1 + (x2 - x1) * t;
          next.push(`M${x1},${y1} H${mx} V${y2} H${x2}`);
        });
      }
      setPaths(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    // `toggle` does not bubble, so listen in the capture phase.
    host.addEventListener("toggle", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      host.removeEventListener("toggle", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      <svg className="size-full overflow-visible">
        {paths.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.22}
            strokeWidth={1.25}
          />
        ))}
      </svg>
    </div>
  );
}
