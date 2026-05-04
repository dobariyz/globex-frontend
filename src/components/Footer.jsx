import { useEffect, useRef, useState, useMemo } from "react";

const SENTIMENT_LABELS = ["EXTREME FEAR", "FEAR", "NEUTRAL", "GREED", "EXTREME GREED"];

function MiniSparkline({ change }) {
  const bars = useMemo(() => {
    const seed = Math.abs(change * 137.5) % 1;
    return Array.from({ length: 8 }, (_, i) => {
      const noise = Math.sin(i * 2.3 + seed * 10) * 0.5 + 0.5;
      const trend = change >= 0 ? i / 9 : 1 - i / 9;
      return Math.max(0.15, Math.min(1, noise * 0.4 + trend * 0.6));
    });
  }, [change]);

  const color = change >= 0 ? "#34d399" : "#f87171";

  return (
    <svg width="32" height="16" viewBox="0 0 32 16" style={{ flexShrink: 0 }}>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 4}
          y={16 - h * 14}
          width="3"
          height={h * 14}
          fill={color}
          opacity={0.4 + i * 0.075}
          rx="0.5"
        />
      ))}
    </svg>
  );
}

function SentimentMeter({ points }) {
  const score = useMemo(() => {
    if (!points?.length) return 50;
    const avg = points.reduce((s, p) => s + p.change, 0) / points.length;
    return Math.min(100, Math.max(0, 50 + avg * 8));
  }, [points]);

  const idx = Math.min(4, Math.floor(score / 20));
  const colors = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#34d399"];
  const color = colors[idx];
  const label = SENTIMENT_LABELS[idx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 16px 0 14px", minWidth: "140px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "8px", color: "#2a3a50", letterSpacing: "1.5px", fontFamily: "'DM Mono', monospace" }}>
          SENTIMENT
        </span>
        <span style={{ fontSize: "8px", color, letterSpacing: "0.5px", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
          {Math.round(score)}
        </span>
      </div>
      <div style={{ position: "relative", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${score}%`,
            background: `linear-gradient(90deg, #f87171 0%, #facc15 50%, #34d399 100%)`,
            borderRadius: "2px",
            transition: "width 1s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${score}%`,
            top: "-1px",
            transform: "translateX(-50%)",
            width: "2px",
            height: "6px",
            background: "#fff",
            borderRadius: "1px",
          }}
        />
      </div>
      <div style={{ fontSize: "8px", color, letterSpacing: "0.5px", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
}

function MarketStats({ points }) {
  const { gainers, losers, flat, topGainer, topLoser } = useMemo(() => {
    if (!points?.length) return { gainers: 0, losers: 0, flat: 0 };
    const g = points.filter((p) => p.change > 0.1);
    const l = points.filter((p) => p.change < -0.1);
    const f = points.filter((p) => Math.abs(p.change) <= 0.1);
    const tg = g.reduce((best, p) => (!best || p.change > best.change ? p : best), null);
    const tl = l.reduce((best, p) => (!best || p.change < best.change ? p : best), null);
    return { gainers: g.length, losers: l.length, flat: f.length, topGainer: tg, topLoser: tl };
  }, [points]);

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "0 16px",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        minWidth: "fit-content",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
        <span style={{ fontSize: "9px", color: "#2a3a50", letterSpacing: "1px", fontFamily: "'DM Mono', monospace" }}>↑</span>
        <span style={{ fontSize: "13px", color: "#34d399", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{gainers}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
        <span style={{ fontSize: "9px", color: "#2a3a50", letterSpacing: "1px", fontFamily: "'DM Mono', monospace" }}>–</span>
        <span style={{ fontSize: "13px", color: "#5a6a85", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{flat}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
        <span style={{ fontSize: "9px", color: "#2a3a50", letterSpacing: "1px", fontFamily: "'DM Mono', monospace" }}>↓</span>
        <span style={{ fontSize: "13px", color: "#f87171", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{losers}</span>
      </div>

      {topGainer && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            padding: "4px 8px",
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.12)",
            borderRadius: "3px",
            minWidth: "80px",
          }}
        >
          <span style={{ fontSize: "7px", color: "#34d399", letterSpacing: "1.5px", fontFamily: "'DM Mono', monospace" }}>
            TOP GAIN
          </span>
          <span style={{ fontSize: "9px", color: "#8a9ab5", fontFamily: "'DM Mono', monospace" }}>
            {topGainer.index || topGainer.country}
          </span>
          <span style={{ fontSize: "11px", color: "#34d399", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
            +{topGainer.change.toFixed(2)}%
          </span>
        </div>
      )}

      {topLoser && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            padding: "4px 8px",
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.12)",
            borderRadius: "3px",
            minWidth: "80px",
          }}
        >
          <span style={{ fontSize: "7px", color: "#f87171", letterSpacing: "1.5px", fontFamily: "'DM Mono', monospace" }}>
            TOP LOSS
          </span>
          <span style={{ fontSize: "9px", color: "#8a9ab5", fontFamily: "'DM Mono', monospace" }}>
            {topLoser.index || topLoser.country}
          </span>
          <span style={{ fontSize: "11px", color: "#f87171", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
            {topLoser.change.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function Footer({ points = [], darkMode, handlePointClick }) {
  const rafRef = useRef(null);
  const posRef = useRef(0);
  const [tickerPos, setTickerPos] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const tripled = useMemo(() => [...points, ...points, ...points], [points]);
  const itemWidth = 200;

  useEffect(() => {
    const totalWidth = points.length * itemWidth;
    if (totalWidth === 0) return;
    const speed = 0.5;
    const step = () => {
      if (!isPaused) {
        posRef.current -= speed;
        if (posRef.current < -totalWidth) posRef.current = 0;
        setTickerPos(posRef.current);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [points.length, isPaused]);

  const BORDER = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const BG = darkMode ? "#050b16" : "#f5f5f5";
  const TEXT_PRIMARY = darkMode ? "#c8d8f0" : "#1a1a1a";
  const TEXT_SECONDARY = darkMode ? "#5a6a85" : "#666666";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

        .gx-footer-pulse {
          animation: gx-pulse 2s ease-in-out infinite;
        }
        @keyframes gx-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #f87171; }
          50% { opacity: 0.4; box-shadow: 0 0 2px #f87171; }
        }

        .gx-ticker-card {
          transition: background 0.15s ease;
        }
        .gx-ticker-card:hover {
          background: rgba(0, 212, 255, 0.05) !important;
          border-color: rgba(0, 212, 255, 0.15) !important;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {/* ── MARKET PULSE BAR (above ticker) ── */}
        <div
          style={{
            height: "3px",
            background: BG,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {points.map((p, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: p.change > 1 ? "#34d399"
                  : p.change > 0 ? "#6ee7b7"
                  : p.change < -1 ? "#f87171"
                  : p.change < 0 ? "#fca5a5"
                  : "#3a4a60",
                opacity: 0.7 + Math.abs(p.change) * 0.1,
              }}
              title={`${p.country}: ${p.change > 0 ? "+" : ""}${p.change?.toFixed(2)}%`}
            />
          ))}
        </div>

        {/* ── MAIN FOOTER BAR ── */}
        <div
          style={{
            height: "48px",
            background: BG,
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {/* LEFT: LIVE + LABEL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 14px",
              borderRight: `1px solid ${BORDER}`,
              height: "100%",
              flexShrink: 0,
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="gx-footer-pulse"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#f87171",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span style={{ fontSize: "8px", color: "#f87171", letterSpacing: "1.5px" }}>LIVE</span>
              <span style={{ fontSize: "7px", color: "#2a3a50", letterSpacing: "1px" }}>TICKER</span>
            </div>
          </div>

          {/* SENTIMENT METER */}
          <SentimentMeter points={points} />

          <div style={{ width: "1px", height: "28px", background: BORDER, flexShrink: 0 }} />

          {/* CENTER: SCROLLING TICKER */}
          <div
            style={{ flex: 1, overflow: "hidden", position: "relative", height: "100%" }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => { setIsPaused(false); setHoveredIdx(null); }}
          >
            {/* Left fade */}
            <div
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "40px",
                background: `linear-gradient(90deg, ${BG}, transparent)`,
                zIndex: 2, pointerEvents: "none",
              }}
            />
            {/* Right fade */}
            <div
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "40px",
                background: `linear-gradient(270deg, ${BG}, transparent)`,
                zIndex: 2, pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                transform: `translateX(${tickerPos}px)`,
                willChange: "transform",
                gap: "6px",
                padding: "6px 0",
              }}
            >
              {tripled.map((p, i) => {
                const isUp = p.change >= 0;
                const absChange = Math.abs(p.change);
                const color = isUp ? "#34d399" : "#f87171";
                const isHovered = hoveredIdx === i;

                return (
                  <div
                    key={i}
                    className="gx-ticker-card"
                    onClick={() => handlePointClick(p)}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 10px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "3px",
                      cursor: "pointer",
                      flexShrink: 0,
                      width: `${itemWidth - 12}px`,
                      height: "34px",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Status dot */}
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: p.isOpen ? "#34d399" : "#3a4a60",
                        flexShrink: 0,
                      }}
                    />

                    {/* Labels */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "9px",
                          color: "#8a9ab5",
                          letterSpacing: "0.3px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.index || p.country}
                      </span>
                      <span style={{ fontSize: "8px", color: "#3a4a60", whiteSpace: "nowrap" }}>
                        {p.country}
                      </span>
                    </div>

                    {/* Sparkline */}
                    <MiniSparkline change={p.change} />

                    {/* Change */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", alignItems: "flex-end", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", color, fontWeight: 700, letterSpacing: "0.3px" }}>
                        {isUp ? "+" : ""}{p.change?.toFixed(2)}%
                      </span>
                      <span style={{ fontSize: "8px", color: "#2a3a50" }}>
                        {p.price != null ? `${p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ width: "1px", height: "28px", background: BORDER, flexShrink: 0 }} />

          {/* RIGHT: MARKET STATS */}
          <MarketStats points={points} />
        </div>
      </div>
    </>
  );
}