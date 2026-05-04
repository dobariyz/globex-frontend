import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Globe from "react-globe.gl";
import countries from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Grid2D } from "./components/Grid2D";
import "./App.css";

// ── Global CSS injected once ──────────────────────────────────────────────────
if (!document.getElementById("globex-animations")) {
  const s = document.createElement("style");
  s.id = "globex-animations";
  s.textContent = `
    * { box-sizing: border-box; }
    body, html { margin:0; padding:0; overflow:hidden; background:#060c18; }
    @keyframes gx-toast-in {
      from { opacity:0; transform:translateY(-8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes gx-pulse {
      0%,100% { opacity:1; } 50% { opacity:0.4; }
    }
  `;
  document.head.appendChild(s);
}

// ── Layout constants (must match Header + Footer) ─────────────────────────────
const HEADER_H = 88; // 62px bar + 26px ticker
const FOOTER_H = 51; // 3px pulse bar + 48px main bar

// ── Colour helper ─────────────────────────────────────────────────────────────
function getColor(pct) {
  // Strong Green (big gains)
  if (pct >= 10)   return "#022c22";
  if (pct >= 5)    return "#065f46";
  if (pct >= 3)    return "#047857";

  // Medium Green
  if (pct >= 1)    return "#059669";
  if (pct >= 0.5)  return "#10b981";

  // Light Green (tiny gains)
  if (pct >= 0.1)  return "#6ee7b7";

  // Neutral (almost no move)
  if (pct > -0.1)  return "#374151"; // subtle gray

  // Light Red (tiny losses)
  if (pct >= -0.5) return "#fecaca";

  // Medium Red
  if (pct >= -1)   return "#fca5a5";
  if (pct >= -3)   return "#f87171";

  // Strong Red (big losses)
  if (pct >= -5)   return "#ef4444";
  if (pct >= -10)  return "#b91c1c";

  return "#7f1d1d"; // extreme crash
}

// ── useWindowSize hook ────────────────────────────────────────────────────────
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    let timeout;
    const fn = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {        // ← debounce 100ms
        setSize({ w: window.innerWidth, h: window.innerHeight });
      }, 100);
    };
    window.addEventListener("resize", fn);
    return () => { window.removeEventListener("resize", fn); clearTimeout(timeout); };
  }, []);
  return size;
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ notifications }) {
  const colors = {
    success: { bg:"rgba(6,95,70,0.95)",  border:"#34d399" },
    info:    { bg:"rgba(5,55,120,0.95)", border:"#00d4ff" },
    warning: { bg:"rgba(92,58,6,0.95)",  border:"#f0b429" },
    error:   { bg:"rgba(100,15,15,0.95)",border:"#f87171" },
  };
  return (
    <>
      {notifications.map((n, i) => {
        const c = colors[n.type] || colors.info;
        return (
          <div key={n.id} style={{
            position:"fixed",
            top: HEADER_H + 12 + i * 48,
            right: 16,
            zIndex: 9999,
            padding:"9px 14px",
            background: c.bg,
            border:`1px solid ${c.border}`,
            borderLeft:`3px solid ${c.border}`,
            borderRadius:4,
            color:"#c8d8f0",
            fontSize:"11px",
            fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.3px",
            animation:"gx-toast-in 0.2s ease",
            backdropFilter:"blur(4px)",
          }}>
            {n.message}
          </div>
        );
      })}
    </>
  );
}

// ── Selected market detail panel ──────────────────────────────────────────────
function DetailPanel({ point, onClose, onFavorite, isFav, getVolatility, getMarketHours }) {
  if (!point) return null;
  const isUp  = point.change >= 0;
  const color = isUp ? "#34d399" : "#f87171";
  const vol   = getVolatility(point.change);
  const hours = getMarketHours(point.country);
  const BORDER = "rgba(255,255,255,0.06)";

  return (
    <div style={{
      position:"fixed",
      top: HEADER_H + 12,
      left: 16,
      zIndex: 500,
      width: 248,
      background:"rgba(5,11,22,0.97)",
      border:`1px solid ${color}33`,
      borderLeft:`3px solid ${color}`,
      borderRadius:4,
      padding:"14px 16px",
      fontFamily:"'DM Mono',monospace",
      boxShadow:"0 12px 40px rgba(0,0,0,0.7)",
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13, color:"#c8d8f0", fontWeight:700, letterSpacing:"0.5px" }}>
            {point.country}
          </div>
          <div style={{ fontSize:9, color:"#3a4a60", letterSpacing:"1px", marginTop:2 }}>
            {point.index} · {point.symbol}
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => onFavorite(point.country)} style={{
            background:"none",
            border:`1px solid ${isFav ? "#f0b429" : BORDER}`,
            borderRadius:3, padding:"3px 7px",
            fontSize:9, color: isFav ? "#f0b429" : "#3a4a60",
            cursor:"pointer", fontFamily:"'DM Mono',monospace",
          }}>
            {isFav ? "★" : "☆"}
          </button>
          <button onClick={onClose} style={{
            background:"none", border:`1px solid ${BORDER}`,
            borderRadius:3, padding:"3px 7px",
            fontSize:11, color:"#3a4a60",
            cursor:"pointer", lineHeight:1,
          }}>×</button>
        </div>
      </div>

      {/* Change */}
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:12 }}>
        <span style={{ fontSize:26, color, fontWeight:700, letterSpacing:"-0.5px" }}>
          {isUp?"+":""}{point.change.toFixed(2)}%
        </span>
        <span style={{ fontSize:9, color: isUp ? "#065f46" : "#7f1d1d" }}>
          {isUp ? "▲ GAIN" : "▼ LOSS"}
        </span>
      </div>

      {/* Stats */}
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:6, padding:10,
        background:"rgba(255,255,255,0.02)",
        border:`1px solid ${BORDER}`,
        borderRadius:3, marginBottom:10,
      }}>
        {[
          { label:"PRICE",
            value: point.price != null
              ? point.price.toLocaleString(undefined,{maximumFractionDigits:2})
              : "—",
            color:"#8a9ab5" },
          { label:"STATUS",
            value: point.isOpen ? "OPEN" : "CLOSED",
            color: point.isOpen ? "#34d399" : "#f87171" },
          { label:"VOLATILITY",
            value: vol === "high" ? "HIGH" : vol === "medium" ? "MEDIUM" : "LOW",
            color: vol === "high" ? "#f87171" : vol === "medium" ? "#f0b429" : "#34d399" },
          { label:"MARKET HRS",
            value:`${hours.open}–${hours.close}`,
            color:"#8a9ab5" },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize:7, color:"#2a3a50", letterSpacing:"1.5px", marginBottom:2 }}>
              {s.label}
            </div>
            <div style={{ fontSize:11, color:s.color, fontWeight:500 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:9, color:"#1e2d40", letterSpacing:"0.3px" }}>
        {hours.tz} TIMEZONE
      </div>

      {(point.dataDate || point.dataTime) && (
        <div style={{
          fontSize:8,
          color:"#2a3a50",
          letterSpacing:"0.3px",
          marginTop:10,
          paddingTop:8,
          borderTop:`1px solid ${BORDER}`,
        }}>
          📅 Updated: {point.dataDate} {point.dataTime}
        </div>
      )}
    </div>
  );
}

// ── Market Leaders panel ──────────────────────────────────────────────────────
function LeadersPanel({ gainers, losers, onClick }) {
  const BORDER = "rgba(255,255,255,0.06)";
  const Row = ({ item, up }) => (
    <div onClick={() => onClick(item)}
      style={{
        padding:"5px 0", cursor:"pointer",
        borderBottom:`1px solid ${BORDER}`,
        transition:"padding-left 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.paddingLeft="6px"}
      onMouseLeave={e => e.currentTarget.style.paddingLeft="0px"}
    >
      <div style={{ fontSize:10, color:"#8a9ab5", fontFamily:"'DM Mono',monospace" }}>
        {item.country}
      </div>
      <div style={{
        fontSize:11, fontWeight:700,
        color: up ? "#34d399" : "#f87171",
        fontFamily:"'DM Mono',monospace",
      }}>
        {up?"+":""}{item.change.toFixed(2)}%
      </div>
    </div>
  );

  return (
    <div style={{
      position:"fixed",
      bottom: FOOTER_H + 16,
      right: 16,
      zIndex: 400,
      width: 230,
      background:"rgba(5,11,22,0.97)",
      border:`1px solid ${BORDER}`,
      borderRadius:4,
      padding:"12px",
      fontFamily:"'DM Mono',monospace",
      boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
    }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <div style={{
            fontSize:7, color:"#34d399", letterSpacing:"1.5px",
            marginBottom:8, paddingBottom:4,
            borderBottom:"1px solid rgba(52,211,153,0.2)",
          }}>TOP GAINERS</div>
          {gainers.map((g,i) => <Row key={i} item={g} up={true}/>)}
        </div>
        <div>
          <div style={{
            fontSize:7, color:"#f87171", letterSpacing:"1.5px",
            marginBottom:8, paddingBottom:4,
            borderBottom:"1px solid rgba(248,113,113,0.2)",
          }}>TOP LOSERS</div>
          {losers.map((l,i) => <Row key={i} item={l} up={false}/>)}
        </div>
      </div>
    </div>
  );
}

// ── Watchlist panel ───────────────────────────────────────────────────────────
function WatchlistPanel({ items, onClick, onRemove }) {
  if (!items.length) return null;
  const BORDER = "rgba(255,255,255,0.06)";
  return (
    <div style={{
      position:"fixed",
      bottom: FOOTER_H + 16,
      left: 16,
      zIndex: 400,
      width: 200,
      maxHeight: 280,
      overflowY:"auto",
      background:"rgba(5,11,22,0.97)",
      border:`1px solid ${BORDER}`,
      borderRadius:4,
      fontFamily:"'DM Mono',monospace",
      boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
    }}>
      <div style={{
        padding:"9px 12px 6px",
        borderBottom:`1px solid ${BORDER}`,
        fontSize:8, color:"#f0b429", letterSpacing:"1.5px",
      }}>
        ★ WATCHLIST · {items.length}
      </div>
      {items.map((item,i) => (
        <div key={i}
          style={{
            padding:"7px 12px",
            borderBottom:`1px solid ${BORDER}`,
            display:"flex", alignItems:"center", gap:8,
            cursor:"pointer", transition:"background 0.12s",
          }}
          onClick={() => onClick(item)}
          onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
          onMouseLeave={e => e.currentTarget.style.background="transparent"}
        >
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, color:"#8a9ab5", whiteSpace:"nowrap",
              overflow:"hidden", textOverflow:"ellipsis" }}>
              {item.country}
            </div>
            <div style={{
              fontSize:11, fontWeight:700,
              color: item.change>=0 ? "#34d399" : "#f87171",
            }}>
              {item.change>=0?"+":""}{item.change.toFixed(2)}%
              <span style={{ fontSize:8, marginLeft:6,
                color: item.isOpen ? "#34d399" : "#3a4a60" }}>
                {item.isOpen?"●":"○"}
              </span>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onRemove(item.country); }}
            style={{
              background:"none", border:"none",
              color:"#2a3a50", cursor:"pointer",
              fontSize:12, padding:0, lineHeight:1,
              flexShrink:0,
            }}
          >×</button>
        </div>
      ))}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const globeEl = useRef();
  const { w: winW, h: winH } = useWindowSize();

  const globeW = winW;
  const globeH = winH - HEADER_H - FOOTER_H;

  const [points,          setPoints]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [selectedPoint,   setSelectedPoint]   = useState(null);
  const [autoRotate,      setAutoRotate]      = useState(true);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [showCountryColors,setShowCountryColors]=useState(true);
  const [performanceFilter,setPerformanceFilter]=useState("all");
  const [heatmapIntensity, setHeatmapIntensity]=useState(0.7);
  const [countriesGeoJson, setCountriesGeoJson]=useState([]);
  const [darkMode,         setDarkMode]        = useState(true); // default dark
  const [marketMode,       setMarketMode]      = useState("all");
  const [soundEnabled,     setSoundEnabled]    = useState(false);
  const [favorites,        setFavorites]       = useState(
    () => JSON.parse(localStorage.getItem("globex-favs") || "[]")
  );
  const [regionFilter,     setRegionFilter]    = useState("all");
  const [notifications,    setNotifications]   = useState([]);
  const [volatilityFilter, setVolatilityFilter]= useState("all");
  const [viewMode,         setViewMode]        = useState("3d");

const colorMap = useMemo(() => {
  const ALIAS = {
    "United States":"United States of America",
    "Russia":"Russian Federation",
    "South Korea":"Republic of Korea",
  };
  const hexToRgba = (hex, a) => {
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };
  const map = {};
  points.forEach(p => {
    const name = ALIAS[p.country] || p.country;
    map[name] = hexToRgba(p.color, heatmapIntensity);
    map[p.country] = map[name];
  });
  return map;
}, [points, heatmapIntensity]);

  // Data fetch
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  // Initialize GeoJSON countries
  useEffect(() => {
    const geoFeatures = feature(countries, countries.objects.countries).features;
    setCountriesGeoJson(geoFeatures);
  }, []);

  // Apply body background based on dark mode
  useEffect(() => {
    document.body.style.background = darkMode ? "#060c18" : "#ffffff";
    document.documentElement.style.background = darkMode ? "#060c18" : "#ffffff";
  }, [darkMode]);

  // Globe controls
  useEffect(() => {
    if (globeEl.current && points.length > 0) {
      globeEl.current.controls().autoRotate      = autoRotate;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotate, points]);

  // Auto-pan to active markets - DISABLED to prevent lag and rendering issues
  // useEffect(() => {
  // if (!autoRotate || !globeEl.current || points.length === 0) return;
  // const active = points.filter(p => p.isOpen);
  // if (!active.length) return;
  // const id = setInterval(() => {
  //   if (!autoRotate) return; // ← extra guard
  //   const m = active[Math.floor(Math.random() * active.length)];
  //   globeEl.current.pointOfView({ lat:m.lat, lng:m.lng, altitude:2 }, 3000);
  // }, 8000);
  // return () => clearInterval(id);
  // }, [autoRotate, points]);

  const fetchData = async () => {
    try {
      const res  = await fetch("http://localhost:8080/api/markets/live");
      const data = await res.json();
      if (!data?.length) { setError("No market data"); setLoading(false); return; }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const mapped = data.map(item => ({
        lat:         item.latitude,
        lng:         item.longitude,
        lon:         item.longitude, // alias for Grid2D
        size:        0.8,
        color:       getColor(item.percentChange ?? 0),
        country:     item.countryName,
        countryCode: item.countryCode,
        index:       item.indexName,
        symbol:      item.indexCode,
        change:      item.percentChange ?? 0,
        price:       item.currentPrice,
        isOpen:      item.isMarketOpen,
        region:      getRegion(item.countryName),
        dataDate:    dateStr,
        dataTime:    timeStr,
      }));

      setPoints(mapped);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("API failed — retrying…");
      setLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const REGION_MAP = {
    "United States":"americas","USA":"americas","Canada":"americas","Brazil":"americas","Mexico":"americas","Argentina":"americas","Chile":"americas",
    "United Kingdom":"europe","Germany":"europe","France":"europe","Switzerland":"europe","Spain":"europe","Italy":"europe","Netherlands":"europe","Sweden":"europe","Norway":"europe","Denmark":"europe","Finland":"europe","Poland":"europe","Austria":"europe","Belgium":"europe","Portugal":"europe","Ireland":"europe","Greece":"europe","Czech Republic":"europe","Romania":"europe","Russia":"europe",
    "India":"asia","Japan":"asia","China":"asia","Australia":"asia","Singapore":"asia","Hong Kong":"asia","South Korea":"asia","Taiwan":"asia","Indonesia":"asia","Thailand":"asia","Malaysia":"asia","Vietnam":"asia","Philippines":"asia","New Zealand":"asia","Pakistan":"asia","Bangladesh":"asia",
  };
  const getRegion      = (c) => REGION_MAP[c] || "other";
  const getVolatility  = (ch) => Math.abs(ch) >= 3 ? "high" : Math.abs(ch) >= 1.5 ? "medium" : "low";
  const getMarketHours = (c) => ({
    "United States":  { open:"09:30", close:"16:00", tz:"EST" },
    "United Kingdom": { open:"08:00", close:"16:30", tz:"GMT" },
    "Germany":        { open:"09:00", close:"17:30", tz:"CET" },
    "Japan":          { open:"09:00", close:"15:00", tz:"JST" },
    "Australia":      { open:"10:00", close:"16:00", tz:"AEST" },
    "Hong Kong":      { open:"09:30", close:"16:00", tz:"HKT" },
    "India":          { open:"09:15", close:"15:30", tz:"IST" },
    "China":          { open:"09:30", close:"15:00", tz:"CST" },
    "Singapore":      { open:"09:00", close:"17:00", tz:"SGT" },
    "Canada":         { open:"09:30", close:"16:00", tz:"EST" },
    "Brazil":         { open:"10:00", close:"17:00", tz:"BRT" },
    "France":         { open:"09:00", close:"17:30", tz:"CET" },
  }[c] || { open:"N/A", close:"N/A", tz:"N/A" });

  const sendNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const toggleFavorite = (country) => {
    const next = favorites.includes(country)
      ? favorites.filter(f => f !== country)
      : [...favorites, country];
    setFavorites(next);
    localStorage.setItem("globex-favs", JSON.stringify(next));
    sendNotification(
      favorites.includes(country) ? "Removed from watchlist" : "Added to watchlist",
      "success"
    );
  };

  const exportToCSV = () => {
    const rows = [
      ["Country","Index","Symbol","Price","Change %","Status"],
      ...displayedPoints.map(p => [
        p.country, p.index, p.symbol,
        (p.price||0).toFixed(2), p.change.toFixed(2),
        p.isOpen?"Open":"Closed",
      ]),
    ];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")], { type:"text/csv" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `globex-${new Date().toISOString().slice(0,10)}.csv`,
    });
    a.click();
    sendNotification("Data exported", "success");
  };

  const getMarketModeFiltered = (arr) => {
    if (marketMode === "active")  return arr.filter(p => p.isOpen);
    if (marketMode === "movers")  return arr.filter(p => Math.abs(p.change) >= 2);
    return arr;
  };

  const filteredPoints = points.filter(p => {
    const q = searchTerm.toLowerCase();
    if (q && !p.country?.toLowerCase().includes(q) && !p.index?.toLowerCase().includes(q)) return false;
    if (performanceFilter === "gainers" && p.change <  0.5)  return false;
    if (performanceFilter === "losers"  && p.change > -0.5)  return false;
    if (regionFilter !== "all" && getRegion(p.country) !== regionFilter) return false;
    if (volatilityFilter === "high" && getVolatility(p.change) !== "high") return false;
    if (volatilityFilter === "low"  && getVolatility(p.change) === "high") return false;
    return true;
  });

  const displayedPoints = getMarketModeFiltered(filteredPoints);

  const handlePointClick = (point) => {
    if (!point) return;
    setSelectedPoint(point);
    if (viewMode === "3d" && globeEl.current) {
      globeEl.current.pointOfView({ lat:point.lat, lng:point.lng, altitude:2.5 }, 1000);
    }
  };

  const getTopPerformers  = (n=3) => [...points].sort((a,b)=>b.change-a.change).slice(0,n);
  const getWorstPerformers = (n=3) => [...points].sort((a,b)=>a.change-b.change).slice(0,n);

  // ── Globe tooltip HTML ────────────────────────────────────────────────────
  const globeTooltip = useCallback((d) => `
    <div style="
      background:rgba(5,11,22,0.97);
      padding:12px 14px;
      border-radius:4px;
      border-left:3px solid ${d.change>=0?"#34d399":"#f87171"};
      border:1px solid ${d.change>=0?"#34d39944":"#f8717144"};
      font-family:'DM Mono',monospace;
      min-width:200px;
    ">
      <div style="font-size:13px;color:#c8d8f0;font-weight:700;margin-bottom:4px">${d.country}</div>
      <div style="font-size:9px;color:#3a4a60;margin-bottom:8px">${d.index} · ${d.symbol}</div>
      <div style="font-size:20px;font-weight:700;color:${d.change>=0?"#34d399":"#f87171"};margin-bottom:6px">
        ${d.change>=0?"+":""}${d.change.toFixed(2)}%
      </div>
      <div style="font-size:10px;color:#3a4a60;margin-bottom:6px">
        ${(d.price||0).toLocaleString(undefined,{maximumFractionDigits:2})} &nbsp;·&nbsp;
        <span style="color:${d.isOpen?"#34d399":"#f87171"}">${d.isOpen?"● OPEN":"○ CLOSED"}</span>
      </div>
      <div style="font-size:8px;color:#2a3a50;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;margin-top:6px">
        📅 ${d.dataDate || 'N/A'} ${d.dataTime || ''}
      </div>
    </div>
  `, []);

  // ── Loading / error screens ───────────────────────────────────────────────
  if (loading || !countriesGeoJson.length) return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background: darkMode ? "#060c18" : "#ffffff",
      fontFamily:"'DM Mono',monospace", flexDirection:"column", gap:16,
      transition: "background 0.3s ease",
    }}>
      <div style={{
        width:40, height:40, borderRadius:"50%",
        border: `2px solid ${darkMode ? "rgba(0,212,255,0.15)" : "rgba(0,0,0,0.15)"}`,
        borderTop: `2px solid ${darkMode ? "#00d4ff" : "#1a1a1a"}`,
        animation:"gx-spin 1s linear infinite",
      }}/>
      <div style={{ fontSize:11, color: darkMode ? "#3a4a60" : "#999", letterSpacing:"2px" }}>
        LOADING MARKET DATA…
      </div>
      <style>{`@keyframes gx-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background: darkMode ? "#060c18" : "#ffffff",
      fontFamily:"'DM Mono',monospace", flexDirection:"column", gap:12,
      transition: "background 0.3s ease",
    }}>
      <div style={{ fontSize:11, color:"#f87171", letterSpacing:"1px" }}>{error}</div>
      <button onClick={fetchData} style={{
        padding:"8px 20px", fontSize:10, letterSpacing:"1px",
        background:"transparent", border:"1px solid rgba(0,212,255,0.3)",
        borderRadius:3, color:"#00d4ff", cursor:"pointer",
        fontFamily:"'DM Mono',monospace",
      }}>RETRY</button>
    </div>
  );

  return (
    <div style={{ 
      background: darkMode ? "#060c18" : "#ffffff", 
      width: "100vw", 
      height: "100vh", 
      overflow: "hidden",
      transition: "background 0.3s ease"
    }}>

      {/* Toasts */}
      <Toast notifications={notifications}/>

      {/* Header */}
      <Header
        darkMode={darkMode}         setDarkMode={setDarkMode}
        viewMode={viewMode}         setViewMode={setViewMode}
        marketMode={marketMode}     setMarketMode={setMarketMode}
        regionFilter={regionFilter} setRegionFilter={setRegionFilter}
        performanceFilter={performanceFilter} setPerformanceFilter={setPerformanceFilter}
        volatilityFilter={volatilityFilter}   setVolatilityFilter={setVolatilityFilter}
        searchTerm={searchTerm}     setSearchTerm={setSearchTerm}
        exportToCSV={exportToCSV}
      />

      {/* Footer */}
      <Footer points={points} darkMode={darkMode} handlePointClick={handlePointClick}/>

      {/* ── 3D GLOBE ────────────────────────────────────────────────────── */}
      {viewMode === "3d" && (
        <div style={{
          position:"fixed",
          top:    HEADER_H,
          left:   0,
          width:  globeW,
          height: globeH,
          overflow:"hidden",
          background:"#000008", // deep space fallback
        }}>
          <Globe
            ref={globeEl}
            width={globeW}
            height={globeH}
              rendererConfig={{ antialias: true, powerPreference: "high-performance" }}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            pointsData={displayedPoints}
            pointColor={d => d.color}
            pointAltitude={0.01}
            pointRadius={d =>
              selectedPoint?.country === d.country
                ? Math.abs(d.change) / 10 + 1.2
                : Math.abs(d.change) / 10 + 0.5
            }
            onPointHover={() => {}}
            onPointClick={handlePointClick}
            polygonsData={countriesGeoJson}
            onPolygonClick={poly => {
              const match = points.find(p => p.country === poly?.properties?.name);
              if (match) handlePointClick(match);
            }}
            polygonCapColor={d =>
              colorMap[d.properties?.name] || "rgba(255,255,255,0.04)"
            }
            polygonSideColor={() => "rgba(255,255,255,0.04)"}
            polygonStrokeColor={() => "rgba(255,255,255,0.12)"}
            pointLabel={globeTooltip}
            atmosphereColor="#1a5fa8"
            atmosphereAltitude={0.18}
          />
        </div>
      )}

      {/* ── 2D MAP ──────────────────────────────────────────────────────── */}
      {viewMode === "2d" && (
        <Grid2D
          displayedPoints={displayedPoints}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          handlePointClick={handlePointClick}
          toggleFavorite={toggleFavorite}
          favorites={favorites}
          countriesGeoJson={countriesGeoJson}
        />
      )}

      {/* ── DETAIL PANEL (both modes) ─────────────────────────────────── */}
      <DetailPanel
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
        onFavorite={toggleFavorite}
        isFav={favorites.includes(selectedPoint?.country)}
        getVolatility={getVolatility}
        getMarketHours={getMarketHours}
      />

      {/* ── MARKET LEADERS (3D only, 2D has its own sidebar) ─────────── */}
      {viewMode === "3d" && points.length > 0 && (
        <LeadersPanel
          gainers={getTopPerformers(3)}
          losers={getWorstPerformers(3)}
          onClick={handlePointClick}
        />
      )}

      {/* ── WATCHLIST ────────────────────────────────────────────────── */}
      {viewMode === "3d" && favorites.length > 0 && (
        <WatchlistPanel
          items={points.filter(p => favorites.includes(p.country))}
          onClick={handlePointClick}
          onRemove={toggleFavorite}
        />
      )}
    </div>
  );
}

export default App;