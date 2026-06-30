// Stanley in full livery — a butler-bear portrait: bow tie, wing collar, and a
// brass pocket watch on a chain. Pure SVG, fixed brand hexes so it reads on
// either background. Used large in the hero; the small face-only Bear stays as
// the chat avatar.
export function ButlerBear({ size = 200, className }: { size?: number; className?: string }) {
  const fur = "#b3893f";
  const furDark = "#9c7434";
  const cream = "#ecdcb6";
  const dark = "#241c14";
  const oxblood = "#6e2a2a";
  const jacket = "#16241c";
  const collar = "#f1ebdf";
  const brass = "#d8b65f";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 210"
      className={className}
      role="img"
      aria-label="Stanley, a butler bear in a bow tie"
    >
      {/* shoulders / jacket */}
      <ellipse cx="100" cy="218" rx="92" ry="54" fill={jacket} />
      <ellipse cx="100" cy="218" rx="92" ry="54" fill="none" stroke="rgba(201,162,75,0.18)" strokeWidth="1" />
      {/* wing collar */}
      <path d="M100 150 L74 152 L92 188 Z" fill={collar} />
      <path d="M100 150 L126 152 L108 188 Z" fill={collar} />
      {/* pocket-watch chain + watch */}
      <path d="M114 168 q26 8 36 26" fill="none" stroke={brass} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="152" cy="197" r="11" fill={brass} stroke="#8a6a1f" strokeWidth="1.5" />
      <circle cx="152" cy="197" r="7.5" fill="#efe1b4" />
      <path d="M152 197 V191 M152 197 L156 199" stroke="#6b5118" strokeWidth="1.2" strokeLinecap="round" />
      {/* bow tie */}
      <path d="M100 157 L82 148 L82 167 Z" fill={oxblood} />
      <path d="M100 157 L118 148 L118 167 Z" fill={oxblood} />
      <circle cx="100" cy="157" r="5" fill="#5a2020" />

      {/* ears */}
      <circle cx="62" cy="46" r="24" fill={fur} />
      <circle cx="138" cy="46" r="24" fill={fur} />
      <circle cx="62" cy="48" r="11" fill={cream} />
      <circle cx="138" cy="48" r="11" fill={cream} />
      {/* head + muzzle */}
      <circle cx="100" cy="92" r="54" fill={fur} />
      <circle cx="100" cy="92" r="54" fill="none" stroke={furDark} strokeWidth="1" />
      <ellipse cx="100" cy="108" rx="30" ry="22" fill={cream} />
      {/* cheeks */}
      <circle cx="68" cy="104" r="6" fill={oxblood} opacity="0.3" />
      <circle cx="132" cy="104" r="6" fill={oxblood} opacity="0.3" />
      {/* eyes */}
      <circle cx="82" cy="82" r="5.5" fill={dark} />
      <circle cx="118" cy="82" r="5.5" fill={dark} />
      <circle cx="84" cy="80" r="1.7" fill="#fff" />
      <circle cx="120" cy="80" r="1.7" fill="#fff" />
      {/* nose + mouth */}
      <ellipse cx="100" cy="98" rx="8" ry="5.5" fill={dark} />
      <path
        d="M100 103 V108 M100 108 q-8 6 -14 2 M100 108 q8 6 14 2"
        fill="none"
        stroke={dark}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
