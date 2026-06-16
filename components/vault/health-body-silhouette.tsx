'use client';

import { cn } from '@/lib/cn';
import type { HealthBodyRegion } from '@/lib/health-body-map';

interface HealthBodySilhouetteProps {
  regions: HealthBodyRegion[];
  activeRegionId: string | null;
  regionDocCounts: Map<string, number>;
  onSelectRegion: (region: HealthBodyRegion) => void;
}

/** Front-view figure with x-ray styling — viewBox 200 × 400 */
export function HealthBodySilhouette({
  regions,
  activeRegionId,
  regionDocCounts,
  onSelectRegion,
}: HealthBodySilhouetteProps) {
  const zoomed = activeRegionId != null;

  return (
    <div className="relative aspect-[1/2] h-full max-h-[min(72vh,580px)] w-auto">
      <div
        className="absolute inset-[-8%_-12%] rounded-[2rem] opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(34,211,238,0.18) 0%, transparent 65%)',
        }}
        aria-hidden
      />

      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-slate-950/90 via-slate-900/95 to-slate-950 shadow-[0_0_60px_rgba(34,211,238,0.08),inset_0_0_80px_rgba(0,0,0,0.5)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.9) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)',
          }}
          aria-hidden
        />

        <svg
          viewBox="0 0 200 400"
          className="relative z-[1] h-full w-full"
          aria-label="Силуэт тела"
        >
          <defs>
            <linearGradient id="xray-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f7fa" stopOpacity="0.14" />
              <stop offset="45%" stopColor="#67e8f9" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="xray-bone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ecfeff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0.55" />
            </linearGradient>
            <radialGradient id="xray-glow" cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            <filter id="bone-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="200" height="400" fill="url(#xray-glow)" />

          {/* Body silhouette */}
          <path
            d="
              M 100 12
              C 72 12, 58 28, 58 46
              C 58 58, 66 66, 74 68
              L 74 78
              C 68 80, 62 84, 58 90
              C 36 94, 22 108, 16 128
              C 10 148, 8 168, 8 188
              C 8 204, 12 214, 18 218
              C 14 232, 10 252, 10 272
              C 10 286, 14 296, 20 298
              L 20 302
              C 12 308, 8 318, 8 332
              C 8 346, 14 356, 24 360
              L 24 364
              C 16 368, 12 376, 14 386
              C 16 394, 26 398, 38 398
              C 48 398, 54 392, 56 382
              L 58 378
              C 56 362, 54 342, 52 318
              C 50 294, 52 268, 56 242
              C 58 228, 60 216, 62 208
              C 66 208, 72 210, 78 214
              C 86 218, 92 220, 100 220
              C 108 220, 114 218, 122 214
              C 128 210, 134 208, 138 208
              C 140 216, 142 228, 144 242
              C 148 268, 150 294, 148 318
              C 146 342, 144 362, 142 378
              L 144 382
              C 146 392, 152 398, 162 398
              C 174 398, 184 394, 186 386
              C 188 376, 184 368, 176 364
              L 176 360
              C 186 356, 192 346, 192 332
              C 192 318, 188 308, 180 302
              L 180 298
              C 186 296, 190 286, 190 272
              C 190 252, 186 232, 182 218
              C 188 214, 192 204, 192 188
              C 192 168, 190 148, 184 128
              C 178 108, 164 94, 142 90
              C 138 84, 132 80, 126 78
              L 126 68
              C 134 66, 142 58, 142 46
              C 142 28, 128 12, 100 12
              Z
            "
            fill="url(#xray-body)"
            stroke="rgba(165,243,252,0.35)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Skeletal overlay */}
          <g
            fill="none"
            stroke="url(#xray-bone)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#bone-glow)"
            opacity="0.72"
          >
            {/* Skull */}
            <ellipse cx="100" cy="42" rx="20" ry="24" />
            <path d="M 88 52 Q 100 58 112 52" />

            {/* Spine */}
            <path d="M 100 68 L 100 198" strokeWidth="1.8" opacity="0.85" />

            {/* Clavicles */}
            <path d="M 72 82 Q 86 78 100 80 Q 114 78 128 82" />

            {/* Rib cage */}
            <path d="M 78 92 Q 68 108 72 124 Q 76 138 82 148" />
            <path d="M 122 92 Q 132 108 128 124 Q 124 138 118 148" />
            <path d="M 80 104 Q 74 116 78 128" />
            <path d="M 120 104 Q 126 116 122 128" />
            <path d="M 82 116 Q 78 126 82 136" />
            <path d="M 118 116 Q 122 126 118 136" />

            {/* Pelvis */}
            <path d="M 72 188 Q 86 204 100 208 Q 114 204 128 188" strokeWidth="1.6" />

            {/* Femurs */}
            <path d="M 82 208 Q 76 248 74 288 Q 72 318 70 348" />
            <path d="M 118 208 Q 124 248 126 288 Q 128 318 130 348" />

            {/* Patellae */}
            <circle cx="72" cy="292" r="4" fill="rgba(165,243,252,0.4)" stroke="none" />
            <circle cx="128" cy="292" r="4" fill="rgba(165,243,252,0.4)" stroke="none" />

            {/* Tibias / fibulas */}
            <path d="M 70 348 L 66 378" strokeWidth="1.2" />
            <path d="M 74 348 L 78 378" strokeWidth="1" opacity="0.6" />
            <path d="M 130 348 L 134 378" strokeWidth="1.2" />
            <path d="M 126 348 L 122 378" strokeWidth="1" opacity="0.6" />

            {/* Humeri */}
            <path d="M 58 92 Q 38 118 24 148 Q 16 168 14 188" />
            <path d="M 142 92 Q 162 118 176 148 Q 184 168 186 188" />

            {/* Forearms */}
            <path d="M 14 188 Q 12 214 14 238 Q 16 258 20 272" />
            <path d="M 186 188 Q 188 214 186 238 Q 184 258 180 272" />

            {/* Hands */}
            <ellipse cx="20" cy="286" rx="8" ry="10" strokeWidth="1" />
            <ellipse cx="180" cy="286" rx="8" ry="10" strokeWidth="1" />

            {/* Feet */}
            <path d="M 56 378 Q 48 388 36 392" />
            <path d="M 144 378 Q 152 388 164 392" />
          </g>

          {/* Soft tissue hints */}
          <g fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="0.8">
            <ellipse cx="100" cy="118" rx="22" ry="16" />
            <ellipse cx="88" cy="162" rx="10" ry="14" opacity="0.6" />
            <ellipse cx="112" cy="162" rx="10" ry="14" opacity="0.6" />
          </g>
        </svg>

        {regions.map((region) => {
          const { xPct, yPct, wPct, hPct } = region.hotspot;
          const isActive = activeRegionId === region.id;
          const hidden = zoomed && !isActive;
          const docCount = regionDocCounts.get(region.id) ?? 0;

          return (
            <button
              key={region.id}
              type="button"
              disabled={hidden}
              aria-label={`${region.label}${docCount ? `, ${docCount} документов` : ''}`}
              onClick={() => onSelectRegion(region)}
              className={cn(
                'group absolute z-[2] rounded-xl border transition-all duration-300',
                'border-cyan-400/50 bg-cyan-400/10',
                'hover:border-cyan-300 hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
                isActive &&
                  'border-cyan-300 bg-cyan-400/25 shadow-[0_0_28px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/30',
                hidden && 'pointer-events-none opacity-0',
                !hidden && zoomed && !isActive && 'opacity-0',
              )}
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                width: `${wPct}%`,
                height: `${hPct}%`,
              }}
            >
              {!zoomed && (
                <span
                  className={cn(
                    'pointer-events-none absolute inset-x-0 bottom-0 translate-y-full pt-1 text-center text-[9px] font-medium tracking-wide text-cyan-200/0 transition-all duration-300',
                    'group-hover:text-cyan-200/80',
                    isActive && 'text-cyan-200/90',
                  )}
                >
                  {region.label}
                </span>
              )}
              {docCount > 0 && !zoomed && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-semibold text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                  {docCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
