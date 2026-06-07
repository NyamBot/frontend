/**
 * NyamBot 캐릭터 로고 — 모던 병아리 (배경 없음).
 * - 그라데이션 몸통 + 또렷한 반짝이 눈 + 부드러운 솜털·볼터치
 * - 손에 든 하트 위치핀 = "맛집을 저장한다"는 핵심 기능 상징
 * 검정 외곽선 대신 톤온톤/그라데이션으로 깔끔하게.
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
        <linearGradient id="nyambot-pin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a72" />
          <stop offset="1" stopColor="#f55a44" />
        </linearGradient>
        <radialGradient id="nyambot-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff9d7e" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ff9d7e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="120" cy="222" rx="58" ry="6" fill="#e9ddae" opacity="0.5" />

      {/* 솜털 (부드러운 2가닥) */}
      <path d="M114 56 Q 108 38 116 32" stroke="#f6c531" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M124 56 Q 130 38 122 32" stroke="#f6c531" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* 발 */}
      <g stroke="#f2a52c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M107 198 L107 210 M107 210 L100 216 M107 210 L107 218 M107 210 L114 216" />
        <path d="M133 198 L133 210 M133 210 L126 216 M133 210 L133 218 M133 210 L140 216" />
      </g>

      {/* 날개 */}
      <path d="M56 144 Q 40 142 44 160 Q 52 168 64 158 Z" fill="#ffca38" />

      {/* 몸통 */}
      <ellipse cx="120" cy="128" rx="76" ry="72" fill="url(#nyambot-body)" />
      <ellipse cx="92" cy="96" rx="18" ry="10" fill="#fff" opacity="0.32" />

      {/* 볼터치 */}
      <circle cx="84" cy="134" r="13" fill="url(#nyambot-cheek)" />
      <circle cx="156" cy="134" r="13" fill="url(#nyambot-cheek)" />

      {/* 눈 (또렷·반짝) */}
      <circle cx="103" cy="116" r="8" fill="#37303f" />
      <circle cx="106" cy="112.5" r="2.6" fill="#fff" />
      <circle cx="100.5" cy="119" r="1.3" fill="#fff" opacity="0.7" />
      <circle cx="137" cy="116" r="8" fill="#37303f" />
      <circle cx="140" cy="112.5" r="2.6" fill="#fff" />
      <circle cx="134.5" cy="119" r="1.3" fill="#fff" opacity="0.7" />

      {/* 부리 */}
      <path d="M112 130 L128 130 L120 123 Z" fill="#ffae2b" />
      <path d="M112 130 L128 130 L120 139 Z" fill="#ef9018" />

      {/* 팔 + 하트 위치핀 = 맛집 저장 */}
      <path d="M173 154 Q 180 147 188 154" stroke="#ffca38" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path
        d="M200 144 C 189 144 181 152 181 162 C 181 176 200 190 200 190 C 200 190 219 176 219 162 C 219 152 211 144 200 144 Z"
        fill="url(#nyambot-pin)"
      />
      <path
        d="M200 169 C 197 164 191 165 191 170 C 191 174 197 177 200 180 C 203 177 209 174 209 170 C 209 165 203 164 200 169 Z"
        fill="#fff"
      />
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
