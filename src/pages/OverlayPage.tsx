import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { bosses, getNextSpawnTime, formatCountdown, parseTimeToMinutes } from "../data/bosses";
import { useBossStore, AlertMinutes } from "../store/useBossStore";

// ============================================================
// TYPES
// ============================================================
interface BossTimer {
  id: string; // unique key (e.g. bossId-scheduleTime)
  bossId: string; // base boss ID (e.g. valento)
  name: string;
  img: string | null;
  nextTime: string;
  diffSeconds: number;
}

// ============================================================
// OVERLAY PAGE
// ============================================================
export default function OverlayPage() {
  const {
    selectedBosses,
    getBossAlerts,
    globalAlerts,
    overlayOrientation, setOverlayOrientation,
    overlayScale, setOverlayScale,
    overlayOpacity, setOverlayOpacity,
    ttsVolume,
  } = useBossStore();

  const [locked, setLocked] = useState(true);
  const [timers, setTimers] = useState<BossTimer[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const lastNotifiedRef = useRef<Record<string, number>>({});

  const isHorizontal = overlayOrientation === "horizontal";

  // Load voices
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const pt = all.filter((v) => v.lang.startsWith("pt"));
      setVoices(pt.length > 0 ? pt : all);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // Sync store changes from the main window in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "timerboss-desktop-store") {
        useBossStore.persist.rehydrate();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // TTS speak
  const speak = useCallback((text: string) => {
    const savedVoiceName = localStorage.getItem("tbs-voice");
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.volume = ttsVolume;
    const voice = voices.find((v) => v.name === savedVoiceName);
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  }, [voices, ttsVolume]);

  // Check and fire alert notifications
  const checkAlerts = useCallback((timer: BossTimer) => {
    const nowMinute = Math.floor(Date.now() / 60000);
    const checkThreshold = (minutes: AlertMinutes, label: string) => {
      const threshold = minutes * 60;
      if (timer.diffSeconds <= threshold && timer.diffSeconds > threshold - 60) {
        const key = `${timer.bossId}-${minutes}-${nowMinute}`;
        if (!lastNotifiedRef.current[key]) {
          lastNotifiedRef.current[key] = 1;
          const bossAlerts = getBossAlerts(timer.bossId);
          const alertKey = `alert${minutes}m` as keyof typeof bossAlerts;
          const globalKey = `alert${minutes}m` as keyof typeof globalAlerts;
          if (bossAlerts[alertKey] || globalAlerts[globalKey]) {
            speak(`${timer.name} vai nascer ${label}`);
          }
        }
      }
    };
    checkThreshold(10, "em 10 minutos");
    checkThreshold(5, "em 5 minutos");
    checkThreshold(2, "em 2 minutos");
    // On start
    if (timer.diffSeconds <= 10 && timer.diffSeconds >= 0) {
      const key = `${timer.bossId}-start-${nowMinute}`;
      if (!lastNotifiedRef.current[key]) {
        lastNotifiedRef.current[key] = 1;
        const bossAlerts = getBossAlerts(timer.bossId);
        if (bossAlerts.alert2m || globalAlerts.alert2m) {
          speak(`${timer.name} nasceu agora!`);
        }
      }
    }
  }, [getBossAlerts, globalAlerts, speak]);

  // Live countdown ticker — every second
  useEffect(() => {
    const tick = () => {
      const active = bosses.filter((b) => selectedBosses.includes(b.id));
      const updated: BossTimer[] = [];
      
      active.forEach((boss) => {
        boss.schedules.forEach((t) => {
          const now = new Date();
          const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
          const evSeconds = parseTimeToMinutes(t) * 60;
          const diffSeconds = evSeconds >= nowSeconds ? evSeconds - nowSeconds : 86400 - (nowSeconds - evSeconds);
          
          updated.push({
            id: `${boss.id}-${t}`,
            bossId: boss.id,
            name: boss.name,
            img: boss.img,
            nextTime: t,
            diffSeconds,
          });
        });
      });

      // Sort by time remaining
      updated.sort((a, b) => a.diffSeconds - b.diffSeconds);
      setTimers(updated.slice(0, 10));
      updated.forEach(checkAlerts);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [selectedBosses, checkAlerts]);

  const handleClose = async () => {
    try {
      await invoke("close_overlay");
    } catch {
      const win = getCurrentWindow();
      await win.close();
    }
  };

  const handleToggleLock = () => {
    setLocked((prev) => !prev);
  };

  // Scale factor
  const scale = overlayScale / 100;
  const bgOpacity = overlayOpacity / 100;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      className="overlay-window"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "transparent",
        userSelect: "none",
      }}
    >
      {/* Main overlay container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: `rgba(6, 6, 16, ${bgOpacity})`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* TITLE BAR */}
        <div
          className={locked ? "no-drag" : "drag-region"}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.3)",
            flexShrink: 0,
            gap: 8,
            cursor: locked ? "default" : "grab",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.8)",
            }}>
              Skytale [genaro] EventAlert
            </span>
            <span style={{
              fontSize: 9, color: "var(--text-muted)", fontWeight: 600,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "1px 6px", borderRadius: 4,
            }}>
              {timers.length} ativo{timers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Controls — no-drag always */}
          <div className="no-drag" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {/* Orientation toggle */}
            <button
              onClick={() => setOverlayOrientation(isHorizontal ? "vertical" : "horizontal")}
              title={isHorizontal ? "Mudar para vertical" : "Mudar para horizontal"}
              style={controlBtnStyle}>
              {isHorizontal ? "⇕" : "⇔"}
            </button>

            {/* Scale down */}
            <button onClick={() => setOverlayScale(overlayScale - 10)} style={controlBtnStyle} title="Diminuir">−</button>
            <span style={{ fontSize: 10, color: "var(--text-muted)", minWidth: 28, textAlign: "center", fontWeight: 700 }}>
              {overlayScale}%
            </span>
            {/* Scale up */}
            <button onClick={() => setOverlayScale(overlayScale + 10)} style={controlBtnStyle} title="Aumentar">+</button>

            {/* Separator */}
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />

            {/* Opacity */}
            <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>
              Opac:
            </span>
            <input type="range" min={20} max={100} step={5} value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="no-drag"
              style={{ width: 60, accentColor: "var(--accent-rose)" }} />

            {/* Separator */}
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />

            {/* Lock/Unlock */}
            <button
              onClick={handleToggleLock}
              title={locked ? "Desbloquear movimento" : "Travar posição"}
              style={{
                ...controlBtnStyle,
                background: locked ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                border: `1px solid ${locked ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
                color: locked ? "#fbbf24" : "var(--accent-emerald)",
              }}>
              {locked ? "🔒" : "🔓"}
            </button>

            {/* Close */}
            <button onClick={handleClose}
              style={{
                ...controlBtnStyle,
                background: "rgba(225,29,72,0.1)",
                border: "1px solid rgba(225,29,72,0.25)",
                color: "#f87171",
              }}>
              ✕
            </button>
          </div>
        </div>

        {/* BOSS CARDS AREA */}
        {timers.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
          }}>
            Nenhum boss selecionado
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              overflowX: isHorizontal ? "auto" : "hidden",
              overflowY: isHorizontal ? "hidden" : "auto",
              padding: isHorizontal ? "10px 12px" : "8px 12px",
              gap: isHorizontal ? 12 : 6,
              alignItems: isHorizontal ? "center" : "stretch",
            }}
          >
            {timers.map((timer) => (
              <BossCard
                key={timer.id}
                timer={timer}
                isHorizontal={isHorizontal}
                scale={scale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// BOSS CARD COMPONENT
// ============================================================
function BossCard({ timer, isHorizontal, scale }: {
  timer: BossTimer;
  isHorizontal: boolean;
  scale: number;
}) {
  const isUrgent = timer.diffSeconds <= 300; // ≤ 5 min
  const isWarning = timer.diffSeconds <= 600; // ≤ 10 min
  const countdownColor = isUrgent ? "#f87171" : isWarning ? "#fbbf24" : "#2875daff";

  const countdownClass = isUrgent ? "countdown-urgent" : isWarning ? "countdown-warning" : "";

  if (isHorizontal) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          minWidth: 110 * scale,
          padding: `${8 * scale}px ${10 * scale}px`,
          background: isUrgent
            ? "rgba(225,29,72,0.08)"
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${isUrgent ? "rgba(225,29,72,0.2)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 10,
          transition: "all 0.5s ease",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow bar at bottom when urgent */}
        {isUrgent && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, #e11d48, transparent)",
            animation: "pulse-glow 1s ease-in-out infinite",
          }} />
        )}

        {/* Boss image + name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 24 * scale, height: 24 * scale,
            borderRadius: 8, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
            background: "rgba(0,0,0,0.4)",
          }}>
            {timer.img ? (
              <img src={timer.img} alt={timer.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16 * scale, color: "rgba(255,255,255,0.3)",
              }}>
                ☠
              </div>
            )}
          </div>
          <div>
            <div style={{
              fontSize: 11 * scale, fontWeight: 800,
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              maxWidth: 80 * scale,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {timer.name}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div
          className={countdownClass}
          style={{
            fontSize: 16 * scale, fontWeight: 900,
            color: countdownColor,
            letterSpacing: "0.05em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
            textShadow: isUrgent ? `0 0 15px ${countdownColor}80` : "none",
          }}
        >
          {formatCountdown(timer.diffSeconds)}
        </div>

        {/* Next spawn time */}
        <div style={{
          fontSize: 9 * scale, color: "var(--text-muted)",
          fontWeight: 600, letterSpacing: "0.05em",
        }}>
          ↑ {timer.nextTime}
        </div>
      </div>
    );
  }

  // VERTICAL layout
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10 * scale,
        padding: `${8 * scale}px ${12 * scale}px`,
        minHeight: 56 * scale,
        flexShrink: 0,
        background: isUrgent
          ? "rgba(225,29,72,0.08)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isUrgent ? "rgba(225,29,72,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 8,
        transition: "all 0.5s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isUrgent && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
          background: "linear-gradient(180deg, transparent, #e11d48, transparent)",
          animation: "pulse-glow 1s ease-in-out infinite",
        }} />
      )}

      {/* Image */}
      <div style={{
        width: 38 * scale, height: 38 * scale, borderRadius: 8,
        overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.4)", flexShrink: 0,
      }}>
        {timer.img ? (
          <img src={timer.img} alt={timer.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18 * scale, color: "rgba(255,255,255,0.3)",
          }}>☠</div>
        )}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12 * scale, fontWeight: 800,
          color: "rgba(255,255,255,0.85)",
          textTransform: "uppercase", letterSpacing: "0.04em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {timer.name}
        </div>
        <div style={{ fontSize: 9 * scale, color: "var(--text-muted)", fontWeight: 600 }}>
          {timer.nextTime}
        </div>
      </div>

      {/* Countdown */}
      <div
        className={countdownClass}
        style={{
          fontSize: 18 * scale, fontWeight: 900,
          color: countdownColor,
          letterSpacing: "0.05em",
          fontVariantNumeric: "tabular-nums",
          textShadow: isUrgent ? `0 0 12px ${countdownColor}80` : "none",
          flexShrink: 0,
        }}
      >
        {formatCountdown(timer.diffSeconds)}
      </div>
    </div>
  );
}

// ============================================================
// CONTROL BUTTON STYLE
// ============================================================
const controlBtnStyle: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.6)",
  fontSize: 12, fontWeight: 700,
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.15s",
  outline: "none",
  padding: 0,
};
