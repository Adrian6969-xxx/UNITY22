import { useEffect, useState } from 'react';
import { supabase, DiseaseHotspot, Severity } from '../lib/supabase';

const ISLAND_PATHS: { id: string; label: string; path: string; labelX: number; labelY: number }[] = [
  {
    id: 'siberut',
    label: 'Siberut',
    labelX: 120,
    labelY: 165,
    path: 'M 90 60 C 100 50 130 52 145 68 C 158 84 162 110 158 140 C 154 170 148 200 138 224 C 128 248 110 262 96 256 C 82 250 74 230 72 206 C 70 182 74 155 78 130 C 82 105 80 70 90 60 Z',
  },
  {
    id: 'sipora',
    label: 'Sipora',
    labelX: 248,
    labelY: 212,
    path: 'M 220 188 C 228 178 248 176 264 184 C 280 192 290 210 288 230 C 286 250 272 262 256 258 C 240 254 226 240 220 222 C 214 204 212 198 220 188 Z',
  },
  {
    id: 'pagai-utara',
    label: 'Pagai Utara',
    labelX: 298,
    labelY: 295,
    path: 'M 270 270 C 280 260 302 258 318 268 C 334 278 342 298 338 318 C 334 338 318 346 302 340 C 286 334 272 318 268 300 C 264 282 260 280 270 270 Z',
  },
  {
    id: 'pagai-selatan',
    label: 'Pagai Selatan',
    labelX: 330,
    labelY: 385,
    path: 'M 306 358 C 318 346 340 346 354 358 C 368 370 374 392 368 412 C 362 432 344 442 328 436 C 312 430 300 414 298 396 C 296 378 294 370 306 358 Z',
  },
];

interface HotspotPoint {
  x: number;
  y: number;
  severity: Severity;
  label: string;
  count: number;
  disease: string;
}

const HOTSPOT_MAP: Record<string, { x: number; y: number }[]> = {
  'Muara Siberut':    [{ x: 100, y: 200 }],
  'Sikabaluan':       [{ x: 118, y: 90 }],
  'Taileleu':         [{ x: 130, y: 238 }],
  'Sioban':           [{ x: 230, y: 210 }],
  'Tua Pejat':        [{ x: 258, y: 228 }],
  'Sikakap':          [{ x: 296, y: 298 }],
  'Bulasat':          [{ x: 318, y: 388 }],
  'Malakopa':         [{ x: 348, y: 406 }],
};

const SEVERITY_COLOR: Record<Severity, string> = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

export default function MentawaiMap() {
  const [hotspots, setHotspots] = useState<DiseaseHotspot[]>([]);
  const [hovered, setHovered] = useState<HotspotPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    supabase.from('disease_hotspots').select('*').then(({ data }) => {
      if (data) setHotspots(data);
    });
  }, []);

  const points: HotspotPoint[] = hotspots.flatMap((h) => {
    const coords = HOTSPOT_MAP[h.location_name] ?? [];
    return coords.map((c) => ({
      x: c.x,
      y: c.y,
      severity: h.severity,
      label: h.location_name,
      count: h.case_count,
      disease: h.disease_name,
    }));
  });

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox="0 0 460 490"
        className="w-full max-w-lg mx-auto drop-shadow-sm"
        style={{ filter: 'drop-shadow(0 4px 24px rgba(3,105,161,0.10))' }}
      >
        {/* Ocean background */}
        <rect width="460" height="490" rx="16" fill="#e0f2fe" />
        {/* Subtle grid */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#bae6fd" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="460" height="490" rx="16" fill="url(#grid)" />

        {/* Islands */}
        {ISLAND_PATHS.map((island) => (
          <g key={island.id}>
            <path
              d={island.path}
              fill="#d1fae5"
              stroke="#6ee7b7"
              strokeWidth="1.5"
              className="transition-colors duration-200"
            />
            <text
              x={island.labelX}
              y={island.labelY}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#065f46"
              className="pointer-events-none"
            >
              {island.label}
            </text>
          </g>
        ))}

        {/* Hotspot indicators */}
        {points.map((pt, i) => {
          const color = SEVERITY_COLOR[pt.severity];
          const isHigh = pt.severity === 'critical' || pt.severity === 'high';
          return (
            <g
              key={i}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const svg = (e.currentTarget as SVGGElement).closest('svg')!.getBoundingClientRect();
                setHovered(pt);
                setTooltipPos({ x: pt.x, y: pt.y });
              }}
              onMouseLeave={() => setHovered(null)}
            >
              {isHigh && (
                <circle r="14" fill={color} fillOpacity="0.2">
                  <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r="7" fill={color} stroke="white" strokeWidth="2" />
              {isHigh && (
                <circle r="4" fill="white" fillOpacity="0.5">
                  <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {/* Tooltip rendered in SVG */}
        {hovered && (
          <g transform={`translate(${Math.min(tooltipPos.x + 14, 310)}, ${Math.max(tooltipPos.y - 50, 10)})`}>
            <rect rx="8" ry="8" width="140" height="64" fill="#1e293b" fillOpacity="0.92" />
            <text x="10" y="20" fontSize="11" fontWeight="700" fill="#f8fafc">{hovered.label}</text>
            <text x="10" y="36" fontSize="10" fill="#94a3b8">{hovered.disease}</text>
            <text x="10" y="52" fontSize="10" fill="#fbbf24">{hovered.count} kasus — {hovered.severity.toUpperCase()}</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 flex-wrap">
        {([['critical', 'Kritis'], ['high', 'Tinggi'], ['medium', 'Sedang'], ['low', 'Rendah']] as [Severity, string][]).map(([sev, label]) => (
          <div key={sev} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: SEVERITY_COLOR[sev] }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
