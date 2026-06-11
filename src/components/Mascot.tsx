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
export function MiniMascot({
  className,
  crying = false,
}: {
  className?: string;
  /** 울고 있는 병아리 — 눈물 */
  crying?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      {/* 작은 머리가닥 3개 */}
      <path d="M37 21 Q 34 14 38 12" stroke="#ffdd5e" strokeWidth="1.0" strokeLinecap="round" fill="none" />
      <path d="M40 21 Q 40 13 40 11" stroke="#ffdd5e" strokeWidth="1.0" strokeLinecap="round" fill="none" />
      <path d="M43 21 Q 46 14 42 12" stroke="#ffdd5e" strokeWidth="1.0" strokeLinecap="round" fill="none" />
      <ellipse cx="40" cy="46" rx="28" ry="24" fill="#ffd84d" stroke="#e0a01a" strokeWidth="1.6" />
      {crying && (
        <>
          {/* 살짝 처진 눈썹 */}
          <path d="M25 41 Q 29 39.5 32.5 41.5" stroke="#2a2d1b" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M55 41 Q 51 39.5 47.5 41.5" stroke="#2a2d1b" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </>
      )}
      <ellipse cx="30" cy="46" rx="2.6" ry="3.4" fill="#2a2d1b" />
      <ellipse cx="50" cy="46" rx="2.6" ry="3.4" fill="#2a2d1b" />
      {crying && (
        <>
          {/* 눈물 방울 */}
          <path d="M29 50 c -2.4 3.2 -2.4 5.8 0 6.8 c 2.4 -1 2.4 -3.6 0 -6.8 Z" fill="#7cc6f0" />
          <path d="M51 50 c -2.4 3.2 -2.4 5.8 0 6.8 c 2.4 -1 2.4 -3.6 0 -6.8 Z" fill="#7cc6f0" />
        </>
      )}
      {/* 부리 — 가로로 길게 (아따맘마 입술 느낌) */}
      <path d="M32 52 L48 52 L40 49 Z" fill="#ffae2b" />
      <path d="M32 52 L48 52 L40 55 Z" fill="#ef9018" />
      <ellipse cx="22" cy="54" rx="3" ry="1.8" fill="#ffb48a" opacity="0.8" />
      <ellipse cx="58" cy="54" rx="3" ry="1.8" fill="#ffb48a" opacity="0.8" />
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
