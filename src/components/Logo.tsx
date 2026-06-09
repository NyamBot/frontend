/**
 * NyamBot 캐릭터 로고 — 말풍선 병아리.
 * - 몸 자체가 말풍선 모양 = "취향 채팅으로 맛집을 추천한다"는 핵심 기능
 * - 병아리 얼굴(솜털·반짝 눈·부리·볼터치), 다리 없음, 노란 그라데이션.
 */
export function NyamBotLogo({
  size = 200,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="NyamBot 캐릭터 로고"
      className={className}
    >
      <defs>
        <linearGradient id="nyambot-body" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffe487" />
          <stop offset="1" stopColor="#ffc230" />
        </linearGradient>
        <radialGradient id="nyambot-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff9d7e" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ff9d7e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="118" cy="218" rx="50" ry="6" fill="#e9ddae" opacity="0.5" />

      {/* 솜털 2가닥 */}
      <path d="M114 42 Q 108 24 116 18" stroke="#f6c531" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M124 42 Q 130 24 122 18" stroke="#f6c531" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* 말풍선 모양 몸통 (꼬리 포함) */}
      <path
        d="M120 40 C 78 40 50 68 50 104 C 50 134 70 159 100 167 L96 196 L128 165 C 164 161 190 135 190 104 C 190 68 162 40 120 40 Z"
        fill="url(#nyambot-body)"
      />
      <ellipse cx="92" cy="78" rx="17" ry="9" fill="#fff" opacity="0.3" />

      {/* 볼터치 */}
      <circle cx="74" cy="110" r="13" fill="url(#nyambot-cheek)" />
      <circle cx="166" cy="110" r="13" fill="url(#nyambot-cheek)" />

      {/* 막대기 눈 │ │ (아따맘마식) */}
      <path d="M101 90 L101 112" stroke="#2a2530" strokeWidth="7" strokeLinecap="round" />
      <path d="M139 90 L139 112" stroke="#2a2530" strokeWidth="7" strokeLinecap="round" />

      {/* 넓게 벌린 병아리 부리 (아따맘마식 와이드) */}
      <path d="M94 126 L146 126 L120 114 Z" fill="#ffb02e" />
      <path d="M94 126 L146 126 L120 140 Z" fill="#ef9018" />
      <path d="M94 126 L146 126" stroke="#d97a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 가로형 로고 락업 — 캐릭터 + 워드마크 (헤더/스플래시용) */
export function NyamBotLockup({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <NyamBotLogo size={52} />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-zinc-900">
          Nyam<span className="text-brand-500">Bot</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-[11px] font-medium text-leaf-500">
            내 맛집을 기억하는 봇
          </span>
        )}
      </span>
    </span>
  );
}
