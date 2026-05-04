import { useState, useEffect, useRef } from "react";

const TICKER_ITEMS = [
  { symbol: "SPX", value: "5,243.18", change: "+0.82%", up: true },
  { symbol: "NIKKEI", value: "38,405.02", change: "+1.14%", up: true },
  { symbol: "FTSE", value: "8,391.40", change: "-0.23%", up: false },
  { symbol: "DAX", value: "18,119.60", change: "+0.55%", up: true },
  { symbol: "HSI", value: "18,963.68", change: "-1.07%", up: false },
  { symbol: "CAC40", value: "8,002.11", change: "+0.38%", up: true },
  { symbol: "ASX200", value: "7,839.20", change: "-0.14%", up: false },
  { symbol: "SENSEX", value: "74,119.49", change: "+0.91%", up: true },
  { symbol: "TSX", value: "21,956.70", change: "+0.47%", up: true },
  { symbol: "IBOVESPA", value: "126,940", change: "-0.66%", up: false },
];

// Dropdown component
function Dropdown({ label, options, active, onSelect, accentColor, accentBg }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "6px 12px",
          fontSize: "10px",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          borderRadius: "3px",
          border: `1px solid rgba(255,255,255,0.06)`,
          background: "rgba(255,255,255,0.02)",
          color: "#5a6a85",
          cursor: "pointer",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {label} ?
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            background: "rgba(7,13,26,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            minWidth: "120px",
            zIndex: 2000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          {options.map((opt) => {
            const isActive = active === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  onSelect(opt.key);
                  setIsOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "10px",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  border: "none",
                  background: isActive ? accentBg : "transparent",
                  color: isActive ? accentColor : "#5a6a85",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#8a9ab5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#5a6a85";
                  }
                }}
              >
                {isActive && "? "}{opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterGroup({ options, active, onSelect, accentColor, accentBg }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {options.map((opt) => {
        const isActive = active === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            title={opt.title || opt.label}
            style={{
              padding: "5px 10px",
              fontSize: "10px",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.5px",
              borderRadius: "3px",
              border: isActive
                ? `1px solid ${accentColor}`
                : "1px solid rgba(255,255,255,0.06)",
              background: isActive ? accentBg : "rgba(255,255,255,0.02)",
              color: isActive ? accentColor : "#5a6a85",
              cursor: "pointer",
              fontWeight: isActive ? 700 : 400,
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "#8a9ab5";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.color = "#5a6a85";
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const MARKET_ZONES = [
  { label: "NYC", offset: -4, color: "#00d4ff" },
  { label: "LON", offset: 1, color: "#f0b429" },
  { label: "TKY", offset: 9, color: "#a78bfa" },
  { label: "SGP", offset: 8, color: "#34d399" },
];

function LiveClock({ offset, label, color }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const local = new Date(utc + 3600000 * offset);
      const h = String(local.getHours()).padStart(2, "0");
      const m = String(local.getMinutes()).padStart(2, "0");
      const s = String(local.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offset]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
      <span style={{ fontSize: "9px", letterSpacing: "1.5px", color: "#5a6a85", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color, letterSpacing: "0.5px", fontWeight: 500 }}>
        {time}
      </span>
    </div>
  );
}

export function Header({
  darkMode,
  setDarkMode,
  viewMode,
  setViewMode,
  marketMode,
  setMarketMode,
  regionFilter,
  setRegionFilter,
  performanceFilter,
  setPerformanceFilter,
  volatilityFilter,
  setVolatilityFilter,
  searchTerm,
  setSearchTerm,
  exportToCSV,
}) {
  const [tickerPos, setTickerPos] = useState(0);
  const [liveCount] = useState(Math.floor(Math.random() * 8) + 14);
  const tickerRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef(0);

  useEffect(() => {
    const speed = 0.4;
    const totalWidth = TICKER_ITEMS.length * 160;
    const step = () => {
      posRef.current -= speed;
      if (posRef.current < -totalWidth) posRef.current = 0;
      setTickerPos(posRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Theme colors based on dark mode
  const BG = darkMode ? "#070d1a" : "#f5f5f5";
  const BORDER = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const TEXT_PRIMARY = darkMode ? "#c8d8f0" : "#1a1a1a";
  const TEXT_SECONDARY = darkMode ? "#5a6a85" : "#666666";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=DM+Mono:wght@400;500&display=swap');

        .globex-filter-sep {
          width: 1px;
          height: 20px;
          background: ${BORDER};
          flex-shrink: 0;
        }

        .globex-search input::placeholder {
          color: ${darkMode ? "#3a4a60" : "#999"};
        }

        .globex-view-btn {
          position: relative;
          padding: 6px 14px;
          font-size: 10px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          font-weight: 500;
        }

        .globex-pulse {
          animation: globex-pulse-ring 2s ease-in-out infinite;
        }

        @keyframes globex-pulse-ring {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        .globex-ticker-item:not(:last-child)::after {
          content: '�';
          margin: 0 18px;
          color: rgba(255,255,255,0.1);
        }

        .globex-csv-btn:hover {
          background: rgba(0, 212, 255, 0.08) !important;
          border-color: rgba(0, 212, 255, 0.3) !important;
          color: #00d4ff !important;
        }

        @media (max-width: 1400px) {
          .globex-world-clocks {
            display: none !important;
          }
        }

        @media (max-width: 1200px) {
          .globex-filters-inline {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {/* -- MAIN HEADER BAND -- */}
        <div
          style={{
            background: BG,
            borderBottom: `1px solid ${BORDER}`,
            height: "62px",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: "16px",
            boxShadow: "0 1px 24px rgba(0,0,0,0.6)",
          }}
        >
          {/* LOGO */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "fit-content" }}>
            {/* Animated globe icon */}
            <div style={{ position: "relative", width: "30px", height: "30px" }}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <circle cx="15" cy="15" r="13" stroke="#00d4ff" strokeWidth="1" opacity="0.3" />
                <circle cx="15" cy="15" r="9" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
                <circle cx="15" cy="15" r="5" fill="#00d4ff" opacity="0.15" />
                <circle cx="15" cy="15" r="3" fill="#00d4ff" opacity="0.8" />
                <line x1="2" y1="15" x2="28" y2="15" stroke="#00d4ff" strokeWidth="0.5" opacity="0.4" />
                <line x1="15" y1="2" x2="15" y2="28" stroke="#00d4ff" strokeWidth="0.5" opacity="0.4" />
                <ellipse cx="15" cy="15" rx="5.5" ry="13" stroke="#00d4ff" strokeWidth="0.5" opacity="0.35" />
              </svg>
              <div
                className="globex-pulse"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#00d4ff",
                  boxShadow: "0 0 8px #00d4ff",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  background: "linear-gradient(90deg, #00d4ff 0%, #a78bfa 60%, #f0b429 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                GLOBEX
              </div>
              <div style={{ fontSize: "8px", color: TEXT_SECONDARY, letterSpacing: "2px", marginTop: "2px" }}>
                MARKETS � LIVE
              </div>
            </div>
          </div>

          {/* LIVE indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 8px",
              background: "rgba(52,211,153,0.06)",
              border: "1px solid rgba(52,211,153,0.15)",
              borderRadius: "3px",
              flexShrink: 0,
            }}
          >
            <div
              className="globex-pulse"
              style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }}
            />
            <span style={{ fontSize: "9px", color: "#34d399", letterSpacing: "1px", fontWeight: 500 }}>
              LIVE
            </span>
            <span style={{ fontSize: "9px", color: TEXT_SECONDARY, letterSpacing: "0.5px" }}>
              {liveCount} mkts
            </span>
          </div>

          {/* WORLD CLOCKS - Hidden on smaller screens */}
          <div
            className="globex-world-clocks"
            style={{
              display: "flex",
              gap: "14px",
              padding: "6px 12px",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${BORDER}`,
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            {MARKET_ZONES.map((z) => (
              <LiveClock key={z.label} label={z.label} offset={z.offset} color={z.color} />
            ))}
          </div>

          <div className="globex-filter-sep" />

          {/* VIEW MODE */}
          <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
            {[
              { key: "3d", label: "? 3D" },
              { key: "2d", label: "� 2D" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className="globex-view-btn"
                style={{
                  border: viewMode === v.key ? "1px solid #00d4ff" : `1px solid ${BORDER}`,
                  background: viewMode === v.key ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                  color: viewMode === v.key ? "#00d4ff" : TEXT_SECONDARY,
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* FILTERS - Inline on large screens, dropdown on small */}
          <div className="globex-filters-inline" style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <div className="globex-filter-sep" />
            <FilterGroup
              options={[
                { key: "all", label: "ALL" },
                { key: "active", label: "OPEN" },
                { key: "movers", label: "MOVERS" },
              ]}
              active={marketMode}
              onSelect={setMarketMode}
              accentColor="#a78bfa"
              accentBg="rgba(167,139,250,0.1)"
            />
            <div className="globex-filter-sep" />
            <FilterGroup
              options={[
                { key: "all", label: "GLOBAL" },
                { key: "americas", label: "AMR" },
                { key: "europe", label: "EUR" },
                { key: "asia", label: "ASI" },
              ]}
              active={regionFilter}
              onSelect={setRegionFilter}
              accentColor="#f0b429"
              accentBg="rgba(240,180,41,0.08)"
            />
            <div className="globex-filter-sep" />
            <FilterGroup
              options={[
                { key: "all", label: "ALL" },
                { key: "gainers", label: "? GAIN" },
                { key: "losers", label: "? LOSS" },
              ]}
              active={performanceFilter}
              onSelect={setPerformanceFilter}
              accentColor="#34d399"
              accentBg="rgba(52,211,153,0.08)"
            />
            <div className="globex-filter-sep" />
            <FilterGroup
              options={[
                { key: "all", label: "VOL" },
                { key: "high", label: "HIGH" },
                { key: "low", label: "LOW" },
              ]}
              active={volatilityFilter}
              onSelect={setVolatilityFilter}
              accentColor="#f87171"
              accentBg="rgba(248,113,113,0.08)"
            />
          </div>

          {/* DROPDOWNS FOR MOBILE */}
          <div style={{ display: "none" }} className="globex-filters-dropdown">
            <Dropdown
              label="MARKET"
              options={[
                { key: "all", label: "ALL" },
                { key: "active", label: "OPEN" },
                { key: "movers", label: "MOVERS" },
              ]}
              active={marketMode}
              onSelect={setMarketMode}
              accentColor="#a78bfa"
              accentBg="rgba(167,139,250,0.1)"
            />
            <Dropdown
              label="REGION"
              options={[
                { key: "all", label: "GLOBAL" },
                { key: "americas", label: "AMR" },
                { key: "europe", label: "EUR" },
                { key: "asia", label: "ASI" },
              ]}
              active={regionFilter}
              onSelect={setRegionFilter}
              accentColor="#f0b429"
              accentBg="rgba(240,180,41,0.08)"
            />
            <Dropdown
              label="PERF"
              options={[
                { key: "all", label: "ALL" },
                { key: "gainers", label: "? GAIN" },
                { key: "losers", label: "? LOSS" },
              ]}
              active={performanceFilter}
              onSelect={setPerformanceFilter}
              accentColor="#34d399"
              accentBg="rgba(52,211,153,0.08)"
            />
            <Dropdown
              label="VOL"
              options={[
                { key: "all", label: "ALL" },
                { key: "high", label: "HIGH" },
                { key: "low", label: "LOW" },
              ]}
              active={volatilityFilter}
              onSelect={setVolatilityFilter}
              accentColor="#f87171"
              accentBg="rgba(248,113,113,0.08)"
            />
          </div>

          {/* SPACER */}
          <div style={{ flex: 1 }} />

          {/* SEARCH */}
          <div
            className="globex-search"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${BORDER}`,
              borderRadius: "4px",
              minWidth: "150px",
              transition: "border-color 0.2s",
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)")}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = BORDER)}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="5" stroke={TEXT_SECONDARY} strokeWidth="1.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" stroke={TEXT_SECONDARY} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: TEXT_PRIMARY,
                fontSize: "11px",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.3px",
                width: "100%",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  background: "none",
                  border: "none",
                  color: TEXT_SECONDARY,
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                �
              </button>
            )}
          </div>

          {/* EXPORT CSV */}
          <button
            onClick={exportToCSV}
            className="globex-csv-btn"
            title="Export visible data to CSV"
            style={{
              padding: "6px 12px",
              fontSize: "10px",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              borderRadius: "3px",
              border: `1px solid ${BORDER}`,
              background: "rgba(255,255,255,0.02)",
              color: TEXT_SECONDARY,
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            ↓ CSV
          </button>

          {/* DARK MODE TOGGLE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light mode" : "Dark mode"}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: `1px solid ${BORDER}`,
              background: "rgba(255,255,255,0.03)",
              color: TEXT_SECONDARY,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)";
              e.currentTarget.style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BORDER;
              e.currentTarget.style.color = TEXT_SECONDARY;
            }}
          >
            {darkMode ? "?" : "?"}
          </button>
        </div>

        {/* -- TICKER TAPE -- */}
        <div
          style={{
            height: "26px",
            background: darkMode ? "rgba(4,8,18,0.98)" : "rgba(245,245,245,0.95)",
            borderBottom: `1px solid ${BORDER}`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Left fade */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "60px",
              background: `linear-gradient(90deg, ${darkMode ? "rgba(4,8,18,1)" : "rgba(245,245,245,1)"} 0%, transparent 100%)`,
              zIndex: 2,
            }}
          />
          {/* Right fade */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "60px",
              background: `linear-gradient(270deg, ${darkMode ? "rgba(4,8,18,1)" : "rgba(245,245,245,1)"} 0%, transparent 100%)`,
              zIndex: 2,
            }}
          />

          <div
            ref={tickerRef}
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              whiteSpace: "nowrap",
              transform: `translateX(${tickerPos}px)`,
              willChange: "transform",
            }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span
                key={i}
                className="globex-ticker-item"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0 18px",
                  fontSize: "10px",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                <span style={{ color: TEXT_SECONDARY, letterSpacing: "0.5px" }}>{item.symbol}</span>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{item.value}</span>
                <span
                  style={{
                    color: item.up ? "#34d399" : "#f87171",
                    fontSize: "9px",
                  }}
                >
                  {item.change}
                </span>
                <span style={{ color: "rgba(255,255,255,0.05)", marginLeft: "8px" }}>|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

