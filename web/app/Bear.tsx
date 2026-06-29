// Stanley himself — a cute butler bear with a bow tie. Pure SVG (no hooks), so
// it works in both server (landing) and client (demo) components. Colours are
// fixed brand hexes that read on either the racing-green or ivory background.
export function Bear({ size = 96, className }: { size?: number; className?: string }) {
  const fur = "#b3893f";
  const cream = "#ecdcb6";
  const dark = "#241c14";
  const oxblood = "#6e2a2a";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label="Stanley, a butler bear"
    >
      {/* ears */}
      <circle cx="26" cy="24" r="14" fill={fur} />
      <circle cx="70" cy="24" r="14" fill={fur} />
      <circle cx="26" cy="25" r="6.5" fill={cream} />
      <circle cx="70" cy="25" r="6.5" fill={cream} />
      {/* head + muzzle */}
      <circle cx="48" cy="50" r="32" fill={fur} />
      <ellipse cx="48" cy="60" rx="17" ry="13" fill={cream} />
      {/* cheeks */}
      <circle cx="32" cy="58" r="3.5" fill={oxblood} opacity="0.32" />
      <circle cx="64" cy="58" r="3.5" fill={oxblood} opacity="0.32" />
      {/* eyes */}
      <circle cx="37" cy="45" r="3" fill={dark} />
      <circle cx="59" cy="45" r="3" fill={dark} />
      <circle cx="38" cy="44" r="0.9" fill="#fff" />
      <circle cx="60" cy="44" r="0.9" fill="#fff" />
      {/* nose + mouth */}
      <ellipse cx="48" cy="54" rx="4.4" ry="3" fill={dark} />
      <path
        d="M48 57 V60 M48 60 q-4.5 3.5 -8 1 M48 60 q4.5 3.5 8 1"
        fill="none"
        stroke={dark}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* bow tie */}
      <path d="M48 80 L39 75 L39 86 Z" fill={oxblood} />
      <path d="M48 80 L57 75 L57 86 Z" fill={oxblood} />
      <circle cx="48" cy="80.5" r="3" fill="#5a2020" />
    </svg>
  );
}
