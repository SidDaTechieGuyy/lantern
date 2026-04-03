import React, { useEffect, useState } from "react";
import CountUp from "react-countup";

// -------------------------------------------------------
// Types
// -------------------------------------------------------

interface AnimatedStatProps {
  glancesUrl: string;       // e.g. "http://localhost:61208"
  endpoint: string;         // e.g. "cpu", "mem", "diskio", "network"
  dataKey: string;          // e.g. "total" for CPU, "percent" for mem
  suffix?: string;          // e.g. "%", " MB", " GB"
  prefix?: string;          // e.g. "$"
  decimals?: number;        // e.g. 1 for "42.3%"
  divisor?: number;         // e.g. 1048576 to convert bytes → MB
  duration?: number;        // countup animation duration in seconds
  label?: string;           // e.g. "CPU Usage"
  refreshInterval?: number; // in ms, default 2000
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

/** Safely dig into a nested object using a dot-separated key path.
 *  e.g. dataKey="rx_bytes_rate" on an array picks index 0 automatically.
 */
function extractValue(data: any, dataKey: string): number {
  // If data is an array, pick the first element
  const target = Array.isArray(data) ? data[0] : data;
  
  // Support dot notation e.g. "cpu_percent"
  const keys = dataKey.split(".");
  let result = target;
  for (const k of keys) {
    if (result == null) return 0;
    result = result[k];
  }
  return typeof result === "number" ? result : parseFloat(result) || 0;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export function AnimatedStat({
  glancesUrl,
  endpoint,
  dataKey,
  suffix = "",
  prefix = "",
  decimals = 1,
  divisor = 1,
  duration = 0.6,
  label = "",
  refreshInterval = 2000,
}: AnimatedStatProps) {
  const [value, setValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!glancesUrl || !endpoint || !dataKey) return;

    // Clean up trailing slash
    const base = glancesUrl.replace(/\/$/, "");
    const url = `${base}/api/3/${endpoint}`;

    const fetchData = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const raw = extractValue(json, dataKey);
        setValue(raw / divisor);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Fetch error");
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately, then on interval
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval); // Cleanup on unmount
  }, [glancesUrl, endpoint, dataKey, divisor, refreshInterval]);

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  if (loading) {
    return (
      <div style={styles.wrapper}>
        {label && <div style={styles.label}>{label}</div>}
        <div style={styles.loading}>...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrapper}>
        {label && <div style={styles.label}>{label}</div>}
        <div style={styles.error}>⚠ {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {label && <div style={styles.label}>{label}</div>}
      <CountUp
        end={value}
        suffix={suffix}
        prefix={prefix}
        decimals={decimals}
        duration={duration}
        preserveValue={true} // 👈 animates from old → new value on each refresh
      />
    </div>
  );
}

// -------------------------------------------------------
// Styles (basic — override in Plasmic as needed)
// -------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  label: {
    fontSize: "0.8em",
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  loading: {
    opacity: 0.4,
    fontSize: "1.2em",
  },
  error: {
    color: "#f87171",
    fontSize: "0.75em",
  },
};
