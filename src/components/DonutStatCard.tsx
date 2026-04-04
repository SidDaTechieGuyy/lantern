import React, { useEffect, useState, useRef } from "react";

interface DonutStatCardProps {
  glancesUrl?: string;
  endpoint?: string;
  dataKey?: string;
  duration?: number;
  label?: string;
  tick?: number;
  className?: string;
  style?: React.CSSProperties;
  staticValue?: number;
  emptyColor?: string;
  innerRadius?: number;
  outerRadius?: number;
  showValue?: boolean;
  gradientStart?: string;
  gradientMid?: string;
  gradientEnd?: string;
}

function extractValue(data: any, dataKey: string): number {
  if (dataKey.startsWith("label:")) {
    const withoutPrefix = dataKey.replace("label:", "");
    const dotIndex = withoutPrefix.lastIndexOf(".");
    const labelPart = withoutPrefix.substring(0, dotIndex);
    const field = withoutPrefix.substring(dotIndex + 1);
    const arr = Array.isArray(data) ? data : [data];
    const found = arr.find((item: any) => item.label === labelPart);
    return found ? parseFloat(found[field]) || 0 : 0;
  }
  const target = Array.isArray(data) ? data[0] : data;
  const keys = dataKey.split(".");
  let result = target;
  for (const k of keys) {
    if (result == null) return 0;
    result = result[k];
  }
  return typeof result === "number" ? result : parseFloat(result) || 0;
}

function useSpringValue(target: number, duration: number) {
  const [display, setDisplay] = useState(target);
  const animRef = useRef<number | null>(null);
  const startRef = useRef({ from: target, to: target, startTime: 0 });

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    startRef.current = { from: display, to: target, startTime: performance.now() };

    const animate = (now: number) => {
      const elapsed = now - startRef.current.startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const current = startRef.current.from + (startRef.current.to - startRef.current.from) * ease;
      setDisplay(current);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target, duration]);

  return display;
}

// Parse "#rrggbb" → [r, g, b]
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// Interpolate between two [r,g,b] colors
function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const b2 = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${b2})`;
}

// Get color at position 0–1 across start→mid→end
function gradientColor(
  t: number,
  start: string,
  mid: string,
  end: string
): string {
  const s = hexToRgb(start);
  const m = hexToRgb(mid);
  const e = hexToRgb(end);
  if (t < 0.5) return lerpColor(s, m, t / 0.5);
  return lerpColor(m, e, (t - 0.5) / 0.5);
}

// Build an SVG arc path
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// How many segments to draw (more = smoother gradient)
const SEGMENTS = 120;

export function DonutStatCard({
  glancesUrl,
  endpoint,
  dataKey,
  duration = 0.6,
  label = "",
  tick = 0,
  className,
  style,
  staticValue,
  emptyColor = "rgba(255,255,255,0.06)",
  innerRadius = 32,
  outerRadius = 44,
  showValue = true,
  gradientStart = "#2dd4bf",
  gradientMid = "#facc15",
  gradientEnd = "#ef4444",
}: DonutStatCardProps) {
  const [value, setValue] = useState<number>(staticValue ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(staticValue === undefined);

  const animatedValue = useSpringValue(value, duration);
  const chartSize = outerRadius * 2 + 10;
  const cx = chartSize / 2;
  const cy = chartSize / 2;
  const strokeWidth = outerRadius - innerRadius;
  const arcRadius = (outerRadius + innerRadius) / 2;

  useEffect(() => {
    if (staticValue !== undefined) {
      setValue(staticValue);
      setLoading(false);
      setError(null);
      return;
    }
    if (!glancesUrl || !endpoint || !dataKey) return;

    const base = glancesUrl.replace(/\/$/, "");
    const url = `${base}/${endpoint}`;

    const fetchData = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const raw = extractValue(json, dataKey);
        setValue(raw);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Fetch error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [glancesUrl, endpoint, dataKey, tick, staticValue]);

  if (error) {
    return (
      <div style={{ ...styles.wrapper, ...style }} className={className}>
        {label && <div style={styles.label}>{label}</div>}
        <div style={styles.error}>⚠ {error}</div>
      </div>
    );
  }

  // Total degrees filled
  const filledDeg = (Math.min(animatedValue, 100) / 100) * 360;

  // Build gradient arc segments (each small segment = 360/SEGMENTS degrees)
  const segmentDeg = 360 / SEGMENTS;

  // Start at top (−90°) going clockwise
  const startAngleDeg = -90;

  const gradientSegments = Array.from({ length: SEGMENTS }, (_, i) => {
    const segStart = startAngleDeg + i * segmentDeg;
    const segEnd = segStart + segmentDeg;
    const t = i / (SEGMENTS - 1); // 0 at top, 1 at full circle
    const color = gradientColor(t, gradientStart, gradientMid, gradientEnd);
    return { segStart, segEnd, color };
  });

  return (
    <div style={{ ...styles.wrapper, ...style }} className={className}>
      <div style={{ position: "relative", width: chartSize, height: chartSize }}>
        <svg width={chartSize} height={chartSize}>

          {/* ── Background full ring ── */}
          <circle
            cx={cx}
            cy={cy}
            r={arcRadius}
            fill="none"
            stroke={emptyColor}
            strokeWidth={strokeWidth}
          />

          {/* ── Gradient arc: only draw segments within the filled angle ── */}
          {!loading && gradientSegments.map(({ segStart, segEnd, color }, i) => {
            const segStartRel = segStart - startAngleDeg; // 0–360
            const segEndRel = segEnd - startAngleDeg;

            // Skip segments beyond filled amount
            if (segStartRel >= filledDeg) return null;

            // Clip last segment if partially filled
            const clippedEnd = Math.min(segEndRel, filledDeg);
            const clippedEndAngle = startAngleDeg + clippedEnd;

            return (
              <path
                key={i}
                d={describeArc(cx, cy, arcRadius, segStart, clippedEndAngle)}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
            );
          })}

          {/* ── Loading state ── */}
          {loading && (
            <circle
              cx={cx}
              cy={cy}
              r={arcRadius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
            />
          )}
        </svg>

        {showValue && (
          <div style={styles.centerText}>
            {loading ? (
              <span style={styles.loadingDots}>···</span>
            ) : (
              <span>{animatedValue.toFixed(1)}%</span>
            )}
          </div>
        )}
      </div>

      {label && <div style={styles.label}>{label}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  centerText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.85em",
    fontWeight: 600,
    pointerEvents: "none",
  },
  loadingDots: {
    opacity: 0.3,
    fontSize: "1.2em",
    letterSpacing: "0.1em",
  },
  label: {
    fontSize: "0.75em",
    opacity: 0.55,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  error: {
    color: "#f87171",
    fontSize: "0.75em",
  },
};
