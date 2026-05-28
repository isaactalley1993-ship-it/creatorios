interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 32, showWordmark = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CreatorOS logo"
      >
        <defs>
          <linearGradient id="creatorOSGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
        </defs>
        {/* Rounded square */}
        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#creatorOSGrad)" />
        {/* Play-triangle inside an open "C" — mic+play combined */}
        <path
          d="M27 13.5C24.8 11.9 22.1 11 19.2 11C12.4 11 7 16.4 7 23.2c0 6.8 5.4 12.2 12.2 12.2"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          transform="translate(0, -3)"
          style={{ display: 'none' }}
        />
        {/* Cleaner: "C" arc + play triangle */}
        <path
          d="M28 14a10 10 0 1 0 0 12"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M17 15.5L26 20L17 24.5V15.5Z"
          fill="white"
        />
      </svg>
      {showWordmark && (
        <span className="font-bold text-foreground" style={{ fontSize: size * 0.55, letterSpacing: "-0.02em" }}>
          CreatorOS
        </span>
      )}
    </div>
  );
}
