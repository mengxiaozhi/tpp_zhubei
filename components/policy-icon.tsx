import type { PolicyPillar } from "@/lib/policies";

export function PolicyIcon({ name }: { name: PolicyPillar["icon"] }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-12" {...shared}>
      {name === "bus" ? (
        <>
          <rect x="10" y="7" width="28" height="31" rx="6" />
          <path d="M14 24h20M17 38v4M31 38v4" />
          <circle cx="17" cy="31" r="2" />
          <circle cx="31" cy="31" r="2" />
          <path d="M16 12h16v8H16z" />
        </>
      ) : null}
      {name === "home" ? (
        <>
          <path d="M6 23 24 8l18 15" />
          <path d="M10 21v20h28V21" />
          <path d="M30 26c0 5-6 9-6 9s-6-4-6-9a6 6 0 0 1 12 0Z" />
        </>
      ) : null}
      {name === "accessibility" ? (
        <>
          <circle cx="24" cy="8" r="4" />
          <path d="M13 17c7 3 15 3 22 0M24 16v10M24 26l-9 13M24 26l9 13" />
          <path d="M9 25a15 15 0 1 0 30 0" opacity=".45" />
        </>
      ) : null}
      {name === "building" ? (
        <>
          <path d="M8 42V19l14-7v30M22 42V7l18 8v27" />
          <path d="M13 25h4M13 32h4M28 18h5M28 25h5M28 32h5M5 42h38" />
        </>
      ) : null}
      {name === "leaf" ? (
        <>
          <path d="M39 8C22 9 10 17 10 29c0 7 5 11 11 11 13 0 19-13 18-32Z" />
          <path d="M8 42c8-11 16-18 25-25" />
          <path d="M21 28c4 0 8 1 11 4" opacity=".5" />
        </>
      ) : null}
      {name === "tool" ? (
        <>
          <path d="M30 7a11 11 0 0 0-11 14L7 33a5.7 5.7 0 1 0 8 8l12-12A11 11 0 0 0 41 18l-7 7-7-7 7-7Z" />
          <circle cx="11" cy="37" r="1.5" />
        </>
      ) : null}
    </svg>
  );
}
