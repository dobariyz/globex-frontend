import { useState, useMemo, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const W = 1200, H = 600;
const SCALE = 148, CX = W / 2, CY = H / 2 + 95;

// Two-way alias table
const NAME_MAP = {
  "United States of America": "United States",
  "United States":            "United States",
  "USA":                      "United States",
  "Russian Federation":       "Russia",
  "Russia":                   "Russia",
  "Republic of Korea":        "South Korea",
  "South Korea":              "South Korea",
  "Democratic People's Republic of Korea": "North Korea",
  "North Korea":              "North Korea",
  "Czech Republic":           "Czech Republic",
  "Czechia":                  "Czech Republic",
  "Taiwan, Province of China":"Taiwan",
  "Taiwan":                   "Taiwan",
  "United Kingdom":           "United Kingdom",
  "Great Britain":            "United Kingdom",
  "Hong Kong SAR":            "Hong Kong",
  "Hong Kong":                "Hong Kong",
};
const normName = (n) => NAME_MAP[n] || n;

// ── Projection ────────────────────────────────────────────────────────────────
function project(lon, lat) {
  const latC = Math.max(-82, Math.min(82, lat));
  const x = CX + SCALE * (lon * Math.PI) / 180;
  const y = CY - SCALE * Math.log(Math.tan(Math.PI / 4 + (latC * Math.PI) / 360));
  return [x, y];
}

function normalizeRing(ring) {
  if (!ring?.length) return ring;
  const out = [[...ring[0]]];
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0];
    const prev = out[i - 1][0];
    while (lon - prev >  180) lon -= 360;
    while (prev - lon >  180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

function geoToPath(geometry) {
  if (!geometry) return "";
  const ringToD = (ring) => {
    const norm = normalizeRing(ring);
    return "M " + norm.map(([lo, la]) => project(lo, la).join(",")).join(" L ") + " Z";
  };
  if (geometry.type === "Polygon")
    return geometry.coordinates.map(ringToD).join(" ");
  if (geometry.type === "MultiPolygon")
    return geometry.coordinates.flatMap((p) => p.map(ringToD)).join(" ");
  return "";
}

// ── Region zoom presets ───────────────────────────────────────────────────────
const VIEWS = {
  global:   { cx: CX,  cy: CY,   s: 1   },
  americas: { cx: 215, cy: 215,  s: 2.2 },
  europe:   { cx: 508, cy: 148,  s: 4.6 },
  asia:     { cx: 752, cy: 228,  s: 2.5 },
};
const viewTransform = ({ cx, cy, s }, offset = { x: 0, y: 0 }) =>
  `translate(${W / 2 - cx * s + offset.x},${H / 2 - cy * s + offset.y}) scale(${s})`;

// ── Centroids ─────────────────────────────────────────────────────────────────
const CENTROIDS = {
  "United States":[-98,39],"Japan":[138,36],"United Kingdom":[-2,54],
  "Germany":[10,51],"China":[105,35],"India":[77,20],"France":[2,46],
  "Canada":[-96,56],"Australia":[133,-27],"Brazil":[-51,-14],
  "South Korea":[128,36],"Hong Kong":[114,22],"Singapore":[104,1],
  "Switzerland":[8,47],"Italy":[12,42],"Spain":[-3,40],"Russia":[90,61],
  "Mexico":[-102,24],"Taiwan":[121,24],"Sweden":[17,62],"Norway":[10,62],
  "Netherlands":[5,52],"Poland":[20,52],"Turkey":[33,39],
  "Saudi Arabia":[45,24],"UAE":[54,24],"South Africa":[25,-29],
  "Argentina":[-65,-34],"Chile":[-71,-35],"Indonesia":[113,-5],
  "Thailand":[101,15],"Malaysia":[110,2],"New Zealand":[172,-41],
  "Israel":[35,31],"Egypt":[30,27],"Nigeria":[8,10],
  "Pakistan":[70,30],"Vietnam":[108,16],"Philippines":[121,12],
  "Denmark":[10,56],"Finland":[26,62],"Austria":[14,47],
  "Belgium":[4,51],"Portugal":[-8,39],"Ireland":[-8,53],
  "Greece":[22,39],"Czech Republic":[15,50],"Romania":[25,46],
};
const getCentroid = (p) => {
  if (p.lon != null && p.lat != null) return [p.lon, p.lat];
  return CENTROIDS[normName(p.country)] || CENTROIDS[p.country] || null;
};

// ── Day/Night toggle ──────────────────────────────────────────────────────────
function DayNightToggle({ darkMode, setDarkMode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{
        fontSize: "8px", color: darkMode ? "#3a4a60" : "#f0b429",
        fontFamily: "'DM Mono', monospace", letterSpacing: "1.5px", minWidth: "26px",
      }}>
        DAY
      </span>
      <div
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? "Switch to Day mode" : "Switch to Night mode"}
        style={{
          width: "52px", height: "26px", borderRadius: "13px", position: "relative",
          cursor: "pointer", flexShrink: 0,
          background: darkMode
            ? "linear-gradient(135deg,#0d1b35,#1a2f5a)"
            : "linear-gradient(135deg,#87ceeb,#f0e68c)",
          border: darkMode ? "1px solid rgba(0,212,255,0.2)" : "1px solid rgba(240,180,41,0.4)",
          transition: "background 0.5s ease, border-color 0.5s ease",
        }}
      >
        {darkMode && [[5,5],[11,14],[17,7]].map(([l,t],i) => (
          <div key={i} style={{
            position:"absolute", left:l, top:t,
            width: i===0?"2px":"1.5px", height: i===0?"2px":"1.5px",
            borderRadius:"50%", background:"rgba(255,255,255,0.85)",
          }}/>
        ))}
        <div style={{
          position:"absolute", top:"3px",
          left: darkMode ? "27px" : "3px",
          width:"20px", height:"20px", borderRadius:"50%",
          background: darkMode ? "#c8e4ff" : "#f0b429",
          boxShadow: darkMode
            ? "0 0 8px rgba(200,228,255,0.5)"
            : "0 0 10px rgba(240,180,41,0.6)",
          transition:"left 0.4s cubic-bezier(0.34,1.56,0.64,1),background 0.4s,box-shadow 0.4s",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"10px", userSelect:"none",
        }}>
          {darkMode ? "☽" : "☀"}
        </div>
      </div>
      <span style={{
        fontSize:"8px", color: darkMode ? "#00d4ff" : "#3a4a60",
        fontFamily:"'DM Mono', monospace", letterSpacing:"1.5px", minWidth:"32px",
      }}>
        NIGHT
      </span>
    </div>
  );
}

// ── Hover label ───────────────────────────────────────────────────────────────
function HoverLabel({ data, pos, darkMode, countryName }) {
  // Show minimal tooltip for countries without market data
  if (!data && !countryName) return null;

  if (!data && countryName) {
    return (
      <div style={{
        position:"absolute",
        left: Math.min(pos.x + 14, pos.x - 5),
        top:  Math.max(pos.y - 72, 8),
        background: darkMode ? "rgba(5,11,22,0.96)" : "rgba(255,255,255,0.96)",
        border:`1px solid ${"rgba(255,255,255,0.2)"}`,
        borderLeft:`2px solid ${"#8a9ab5"}`,
        borderRadius:"3px", padding:"7px 11px",
        fontFamily:"'DM Mono', monospace",
        pointerEvents:"none", zIndex:300,
        minWidth:"140px",
      }}>
        <div style={{ fontSize:"11px", color: darkMode ? "#c8d8f0" : "#1a2f4a", fontWeight:700 }}>
          {countryName}
        </div>
        <div style={{ fontSize:"8px", color: darkMode ? "#3a4a60" : "#6a7a90", marginTop:"4px" }}>
          No market data
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isUp  = data.change >= 0;
  const color = isUp ? "#34d399" : "#f87171";
  return (
    <div style={{
      position:"absolute",
      left: Math.min(pos.x + 14, pos.x - 5),
      top:  Math.max(pos.y - 72, 8),
      background: darkMode ? "rgba(5,11,22,0.96)" : "rgba(255,255,255,0.96)",
      border:`1px solid ${color}44`,
      borderLeft:`2px solid ${color}`,
      borderRadius:"3px", padding:"7px 11px",
      fontFamily:"'DM Mono', monospace",
      pointerEvents:"none", zIndex:300,
      minWidth:"170px",
    }}>
      <div style={{ fontSize:"11px", color: darkMode ? "#c8d8f0" : "#1a2f4a", fontWeight:700, marginBottom:"2px" }}>
        {data.country}
      </div>
      <div style={{ fontSize:"9px", color: darkMode ? "#3a4a60" : "#6a7a90", marginBottom:"5px" }}>
        {data.index || data.symbol}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <span style={{ fontSize:"13px", color, fontWeight:700 }}>
          {isUp?"+":""}{data.change.toFixed(2)}%
        </span>
        <span style={{ fontSize:"9px", color: data.isOpen ? "#34d399" : "#3a4a60" }}>
          {data.isOpen ? "● OPEN" : "○ CLOSED"}
        </span>
      </div>
      {data.price != null && (
        <div style={{ fontSize:"9px", color: darkMode ? "#2a3a50" : "#5a6a80", marginTop:"3px" }}>
          {data.price.toLocaleString(undefined,{maximumFractionDigits:2})}
        </div>
      )}
      {(data.dataDate || data.dataTime) && (
        <div style={{
          fontSize:"8px",
          color: darkMode ? "#2a3a50" : "#8a9aa0",
          marginTop:"4px",
          paddingTop:"4px",
          borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        }}>
          📅 {data.dataDate} {data.dataTime || ""}
        </div>
      )}
    </div>
  );
}

// ── Flow arc ──────────────────────────────────────────────────────────────────
function FlowArc({ from, to, color }) {
  const mx = (from[0] + to[0]) / 2;
  const my = Math.min(from[1], to[1]) - 55;
  return (
    <path
      d={`M${from[0]},${from[1]} Q${mx},${my} ${to[0]},${to[1]}`}
      fill="none" stroke={color} strokeWidth="0.7"
      opacity="0.28" strokeDasharray="4 7"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function Grid2D({
  displayedPoints,
  darkMode,
  setDarkMode,
  handlePointClick,
  toggleFavorite,
  favorites,
  countriesGeoJson,
}) {
  const [hoveredGeoName, setHoveredGeoName] = useState(null);
  const [mousePos,       setMousePos]       = useState({ x: 0, y: 0 });
  const [activeView,     setActiveView]     = useState("global");
  const [showArcs,       setShowArcs]       = useState(true);
  const [selectedName,   setSelectedName]   = useState(null);
  const [mapMode,        setMapMode]        = useState("filled"); // NEW: filled, outline, hybrid
  const [dragOffset,     setDragOffset]     = useState({ x: 0, y: 0 });
  const [isDragging,     setIsDragging]     = useState(false);
  const containerRef = useRef(null);
  const dragStart = useRef(null);
  const dragOffsetStart = useRef(null);

  // Build lookup
  const countryDataMap = useMemo(() => {
    const map = {};
    displayedPoints.forEach((p) => {
      const canonical = normName(p.country);
      map[p.country]  = p;
      map[canonical]  = p;
      Object.entries(NAME_MAP).forEach(([alias, target]) => {
        if (target === canonical) map[alias] = p;
      });
    });
    return map;
  }, [displayedPoints]);

  // Top movers for arcs
  const arcPairs = useMemo(() => {
    const movers = [...displayedPoints]
      .filter((p) => Math.abs(p.change) > 0.8 && getCentroid(p))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 8);
    const pairs = [];
    for (let i = 0; i < movers.length - 1 && pairs.length < 5; i++)
      pairs.push([movers[i], movers[i + 1]]);
    return pairs;
  }, [displayedPoints]);

  const hoveredData = countryDataMap[hoveredGeoName] || null;
  const sc          = VIEWS[activeView].s;

  // ⭐ THEME COLORS - Change based on darkMode
  const THEME = darkMode ? {
    BG:          "#060c18",
    SVG_BG:      "#070f1e",
    BORDER:      "rgba(255,255,255,0.06)",
    GRID_LINE:   "rgba(255,255,255,0.04)",
    COUNTRY_STROKE: "rgba(255,255,255,0.75)",
    COUNTRY_BASE: "rgba(255,255,255,0.055)",
    PANEL_BG:    "rgba(5,11,22,0.93)",
    TEXT_PRIMARY: "#c8d8f0",
    TEXT_SECONDARY: "#3a4a60",
    TEXT_MUTED:  "#2a3a50",
  } : {
    BG:          "#e8f0f8",
    SVG_BG:      "#f0f8ff",
    BORDER:      "rgba(0,0,0,0.08)",
    GRID_LINE:   "rgba(0,0,0,0.05)",
    COUNTRY_STROKE: "rgba(0,0,0,0.75)",
    COUNTRY_BASE: "rgba(200,210,220,0.15)",
    PANEL_BG:    "rgba(255,255,255,0.95)",
    TEXT_PRIMARY: "#1a2f4a",
    TEXT_SECONDARY: "#4a5a75",
    TEXT_MUTED:  "#6a7a90",
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // left click only
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffsetStart.current = { ...dragOffset };
  };

  const handleMouseMove = (e) => {
    // existing mouse move for tooltip
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // drag logic
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setDragOffset({
      x: dragOffsetStart.current.x + dx,
      y: dragOffsetStart.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        .gx2-country { transition: opacity 0.12s, filter 0.12s, fill 0.3s, stroke 0.3s; }
        .gx2-country:hover { opacity:1!important; filter:brightness(1.65)!important; }
        .gx2-inner { transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
        .gx2-btn    { font-family:'DM Mono',monospace; transition: all 0.15s; cursor:pointer; }
        .gx2-btn:hover { border-color:rgba(0,212,255,0.3)!important; color:#8a9ab5!important; }
      `}</style>

      <div style={{
        position:"fixed",
        top:"88px",
        bottom:"51px",
        left:0, right:0,
        background: THEME.BG,
        overflow:"hidden",
        transition: "background 0.5s ease",
      }}>
        {/* SVG map */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width:"100%", height:"100%", position:"relative",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
        <svg
          viewBox={`0 -55 ${W} 690`}
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
          style={{ width:"100%", height:"100%", display:"block" }}
        >
        <rect x={0} y={-55} width={W} height={690} fill={THEME.SVG_BG} style={{ transition:"fill 0.5s ease" }} />
            {/* Grid lines */}
            {[-60,-30,0,30,60].map(lat => {
              const [,y] = project(0,lat);
              return <line key={`la${lat}`} x1={0} y1={y} x2={W} y2={y}
                stroke={THEME.GRID_LINE} strokeWidth="0.5" strokeDasharray="4 8"
                style={{ transition: "stroke 0.5s ease" }}/>;
            })}
            {[-120,-60,0,60,120].map(lon => {
              const [x] = project(lon,0);
              return <line key={`lo${lon}`} x1={x} y1={-55} x2={x} y2={635}
                stroke={THEME.GRID_LINE} strokeWidth="0.5" strokeDasharray="4 8"
                style={{ transition: "stroke 0.5s ease" }}/>;
            })}

            <g
              className="gx2-inner"
              transform={viewTransform(VIEWS[activeView], dragOffset)}
              style={{ transition: isDragging ? "none" : "transform 0.6s cubic-bezier(0.4,0,0.2,1)" }}
            >

              {/* Countries */}
              {countriesGeoJson.map((feat, idx) => {
                const geoName = feat.properties?.name;
                const data    = countryDataMap[geoName];
                const path    = geoToPath(feat.geometry);
                const isHov   = hoveredGeoName === geoName;
                const isSel   = selectedName   === geoName;

                // Map mode logic
                let countryFill, countryOpacity;
                if (mapMode === "outline") {
                  countryFill = "none";
                  countryOpacity = 1;
                } else if (mapMode === "hybrid") {
                  countryFill = data ? data.color : "none";
                  countryOpacity = data ? 0.4 : 1;
                } else { // filled
                  countryFill = data ? data.color : THEME.COUNTRY_BASE;
                  countryOpacity = data ? (isHov||isSel ? 1 : 0.78) : 0.55;
                }

                return (
                  <path
                    key={idx}
                    className="gx2-country"
                    d={path}
                    fill={countryFill}
                    stroke={isSel ? "#00d4ff" : isHov ? (darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)") : THEME.COUNTRY_STROKE}
                    strokeWidth={(isSel ? 1.8 : isHov ? 1.2 : 0.7) / sc}
                    opacity={countryOpacity}
                    style={{ cursor: data ? "pointer" : "default" }}
                    onClick={() => {
                      if (!data) return;
                      setSelectedName(geoName);
                      handlePointClick(data);
                    }}
                    onMouseEnter={() => setHoveredGeoName(geoName)}
                    onMouseLeave={() => setHoveredGeoName(null)}
                  />
                );
              })}

              {/* Flow arcs */}
              {showArcs && arcPairs.map(([a,b],i) => {
                const ca = getCentroid(a), cb = getCentroid(b);
                if (!ca||!cb) return null;
                const col = a.change>=0&&b.change>=0 ? "#34d399"
                  : a.change<0&&b.change<0 ? "#f87171" : "#f0b429";
                return <FlowArc key={i}
                  from={project(ca[0],ca[1])} to={project(cb[0],cb[1])} color={col}/>;
              })}

              {/* Market dots */}
              {displayedPoints.map((p) => {
                const c = getCentroid(p);
                if (!c) return null;
                const [px,py] = project(c[0],c[1]);
                const isUp  = p.change >= 0;
                const isSel = selectedName && countryDataMap[selectedName]?.country === p.country;
                const r     = Math.max(2.5, Math.min(7, 2.5 + Math.abs(p.change) * 0.9));
                const col   = isUp ? "#34d399" : "#f87171";

                const geoKey = Object.keys(countryDataMap).find(
                  k => countryDataMap[k] === p && countriesGeoJson.some(f => f.properties?.name === k)
                ) || p.country;

                return (
                  <g key={p.country}
                    style={{ cursor:"pointer" }}
                    onClick={() => { setSelectedName(geoKey); handlePointClick(p); }}
                    onMouseEnter={() => setHoveredGeoName(geoKey)}
                    onMouseLeave={() => setHoveredGeoName(null)}
                  >
                    {isSel && <circle cx={px} cy={py} r={(r+5)/sc}
                      fill="none" stroke="#00d4ff" strokeWidth={1/sc} opacity="0.55"/>}
                    <circle cx={px} cy={py} r={r/sc} fill={col} opacity="0.88"/>
                    <circle cx={px} cy={py} r={r*0.38/sc} fill={darkMode ? "#060c18" : "#f0f8ff"} opacity="0.65"/>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Hover tooltip */}
          <HoverLabel data={hoveredData} pos={mousePos} darkMode={darkMode} countryName={hoveredGeoName}/>
        </div>

        {/* ── CONTROLS — top left ─────────────────────────────────────────── */}
        <div style={{
          position:"absolute", top:16, left:16,
          display:"flex", flexDirection:"column", gap:8, zIndex:200,
        }}>
          {/* Day / Night toggle */}
          <div style={{
            padding:"8px 12px",
            background: THEME.PANEL_BG,
            border:`1px solid ${THEME.BORDER}`,
            borderRadius:4,
            transition: "background 0.3s, border-color 0.3s",
          }}>
            <DayNightToggle darkMode={darkMode} setDarkMode={setDarkMode}/>
          </div>

          {/* Map Mode Toggle */}
          <div style={{
            padding:"8px",
            background: THEME.PANEL_BG,
            border:`1px solid ${THEME.BORDER}`,
            borderRadius:4,
            display:"flex", flexDirection:"column", gap:3,
            transition: "background 0.3s, border-color 0.3s",
          }}>
            <div style={{ fontSize:"7px", color: THEME.TEXT_MUTED,
              fontFamily:"'DM Mono',monospace", letterSpacing:"1.5px", marginBottom:4 }}>
              MAP MODE
            </div>
            {[
              { key:"filled",  label:"◆ FILLED"  },
              { key:"outline", label:"◇ OUTLINE" },
              { key:"hybrid",  label:"◈ HYBRID"  },
            ].map(({ key, label }) => (
              <button key={key} className="gx2-btn"
                onClick={() => setMapMode(key)}
                style={{
                  padding:"5px 10px", fontSize:"9px", letterSpacing:"0.8px",
                  background: mapMode===key ? "rgba(240,180,41,0.1)" : "transparent",
                  border:`1px solid ${mapMode===key ? "rgba(240,180,41,0.4)" : THEME.BORDER}`,
                  borderRadius:3,
                  color: mapMode===key ? "#f0b429" : THEME.TEXT_SECONDARY,
                  textAlign:"left", textTransform:"uppercase",
                  fontWeight: mapMode===key ? 700 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Flow arcs */}
          <button
            className="gx2-btn"
            onClick={() => setShowArcs(v=>!v)}
            style={{
              padding:"6px 12px", fontSize:"9px", letterSpacing:"1px",
              background: THEME.PANEL_BG,
              border:`1px solid ${showArcs ? "rgba(240,180,41,0.35)" : THEME.BORDER}`,
              borderRadius:3,
              color: showArcs ? "#f0b429" : THEME.TEXT_SECONDARY,
              textTransform:"uppercase",
              transition: "background 0.3s, border-color 0.3s",
            }}
          >
            ⌁ FLOW ARCS
          </button>

          {/* Region zoom */}
          <div style={{
            padding:"8px",
            background: THEME.PANEL_BG,
            border:`1px solid ${THEME.BORDER}`,
            borderRadius:4,
            display:"flex", flexDirection:"column", gap:3,
            transition: "background 0.3s, border-color 0.3s",
          }}>
            <div style={{ fontSize:"7px", color: THEME.TEXT_MUTED,
              fontFamily:"'DM Mono',monospace", letterSpacing:"1.5px", marginBottom:4 }}>
              ZOOM REGION
            </div>
            {[
              { key:"global",   label:"◎ GLOBAL"   },
              { key:"americas", label:"▸ AMERICAS"  },
              { key:"europe",   label:"▸ EUROPE"    },
              { key:"asia",     label:"▸ ASIA-PAC"  },
            ].map(({ key, label }) => (
              <button key={key} className="gx2-btn"
                onClick={() => { setActiveView(key); setDragOffset({ x: 0, y: 0 }); }}
                style={{
                  padding:"5px 10px", fontSize:"9px", letterSpacing:"0.8px",
                  background: activeView===key ? "rgba(0,212,255,0.07)" : "transparent",
                  border:`1px solid ${activeView===key ? "rgba(0,212,255,0.3)" : THEME.BORDER}`,
                  borderRadius:3,
                  color: activeView===key ? "#00d4ff" : THEME.TEXT_SECONDARY,
                  textAlign:"left", textTransform:"uppercase",
                  fontWeight: activeView===key ? 700 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── LEGEND — top right ──────────────────────────────────────────── */}
        <div style={{
          position:"absolute", top:16, right:16,
          background: THEME.PANEL_BG,
          border:`1px solid ${THEME.BORDER}`,
          borderRadius:4, padding:12,
          minWidth:165,
          fontFamily:"'DM Mono',monospace",
          zIndex:200,
          transition: "background 0.3s, border-color 0.3s",
        }}>
          <div style={{ fontSize:"7px", color: THEME.TEXT_MUTED, letterSpacing:"1.5px", marginBottom:10 }}>
            PERFORMANCE SCALE
          </div>
          <div style={{
            height:5, borderRadius:2, marginBottom:4,
            background:"linear-gradient(90deg,#7f1d1d 0%,#f87171 20%,#fca5a5 35%,#3a4a60 50%,#6ee7b7 65%,#34d399 80%,#065f46 100%)",
          }}/>
          <div style={{
            display:"flex", justifyContent:"space-between",
            fontSize:"7px", color: THEME.TEXT_MUTED, marginBottom:10,
          }}>
            <span>≤ −5%</span><span>0</span><span>≥ +5%</span>
          </div>
          {[
            { color:"#065f46", label:"Strong gain   ≥ +5%" },
            { color:"#34d399", label:"Gain  +0.5% → +5%"  },
            { color:"#6ee7b7", label:"Minor gain    +0.2% → +0.5%" },
            { color:"#3a4a60", label:"Neutral       ±0.2%" },
            { color:"#fca5a5", label:"Minor loss    −0.5% → −0.2%" },
            { color:"#f87171", label:"Loss  −5% → −0.5%"  },
            { color:"#7f1d1d", label:"Strong loss   ≤ −5%" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:color, flexShrink:0 }}/>
              <span style={{ fontSize:"9px", color: THEME.TEXT_SECONDARY }}>{label}</span>
            </div>
          ))}

          {/* Live counts */}
          <div style={{
            marginTop:10, paddingTop:8,
            borderTop:`1px solid ${THEME.BORDER}`,
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:4,
          }}>
            {[
              { label:"TOTAL",  value:displayedPoints.length,                                color:"#8a9ab5" },
              { label:"OPEN",   value:displayedPoints.filter(p=>p.isOpen).length,            color:"#34d399" },
              { label:"↑ GAIN", value:displayedPoints.filter(p=>p.change>=0.1).length,       color:"#34d399" },
              { label:"↓ LOSS", value:displayedPoints.filter(p=>p.change<-0.1).length,       color:"#f87171" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize:"7px", color: THEME.TEXT_MUTED, letterSpacing:"1px" }}>{label}</div>
                <div style={{ fontSize:"13px", color, fontWeight:700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}