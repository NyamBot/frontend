import { Utensils } from "lucide-react";

/** NyamBot 마스코트 — 큰 사이즈 (로그인 히어로 등) */
export function Mascot({ size = 220 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="NyamBot 캐릭터"
    >
      <ellipse cx="110" cy="200" rx="62" ry="7" fill="rgba(46,77,24,0.18)" />
      <g>
        <path
          d="M110 46 C 96 26 118 14 130 22 C 134 38 122 50 110 48 Z"
          fill="#b6df80"
          stroke="#2f4d18"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M118 26 L114 42" stroke="#2f4d18" strokeWidth="2" strokeLinecap="round" />
        <path d="M110 56 L110 64" stroke="#2f4d18" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <ellipse cx="110" cy="120" rx="78" ry="68" fill="#ffd84d" stroke="#2a2d1b" strokeWidth="3.5" />
      <ellipse cx="78" cy="92" rx="18" ry="10" fill="#fff3a3" opacity="0.85" />
      <ellipse cx="86" cy="118" rx="7" ry="9" fill="#2a2d1b" />
      <ellipse cx="134" cy="118" rx="7" ry="9" fill="#2a2d1b" />
      <circle cx="88.5" cy="114" r="2.2" fill="#fff" />
      <circle cx="136.5" cy="114" r="2.2" fill="#fff" />
      <ellipse cx="72" cy="142" rx="10" ry="5.5" fill="#ffb48a" opacity="0.75" />
      <ellipse cx="148" cy="142" rx="10" ry="5.5" fill="#ffb48a" opacity="0.75" />
      <path
        d="M94 144 Q 110 162 126 144"
        stroke="#2a2d1b"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M106 152 Q 110 158 114 152 Z" fill="#ff8a65" opacity="0.85" />
      <g transform="rotate(-18 175 80)">
        <rect x="172" y="40" width="4" height="60" rx="2" fill="#7a5a1a" />
        <rect x="180" y="44" width="4" height="60" rx="2" fill="#7a5a1a" />
      </g>
    </svg>
  );
}

/** 작은 마스코트 — 아바타/엠티 스테이트용 */
export function MiniMascot({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <ellipse cx="40" cy="74" rx="22" ry="3" fill="rgba(46,77,24,0.15)" />
      <path
        d="M40 18 C 33 8 47 4 52 9 C 54 17 47 22 40 20 Z"
        fill="#b6df80"
        stroke="#2f4d18"
        strokeWidth="1.6"
      />
      <ellipse cx="40" cy="46" rx="28" ry="24" fill="#ffd84d" stroke="#2a2d1b" strokeWidth="2" />
      <ellipse cx="30" cy="46" rx="2.6" ry="3.4" fill="#2a2d1b" />
      <ellipse cx="50" cy="46" rx="2.6" ry="3.4" fill="#2a2d1b" />
      <path
        d="M34 54 Q 40 60 46 54"
        stroke="#2a2d1b"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="54" rx="3" ry="1.8" fill="#ffb48a" opacity="0.8" />
      <ellipse cx="56" cy="54" rx="3" ry="1.8" fill="#ffb48a" opacity="0.8" />
    </svg>
  );
}

/** 브랜드 마크 — 둥근 앰버 배지 안에 포크/나이프 */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl bg-brand-300 text-leaf-600 shadow-sm"
      style={{ width: size + 16, height: size + 16 }}
    >
      <Utensils size={size} />
    </span>
  );
}
