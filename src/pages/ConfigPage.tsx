import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { bosses } from "../data/bosses";
import { useBossStore, AlertMinutes } from "../store/useBossStore";
import { getNextSpawnTime, formatCountdown } from "../data/bosses";

// ============================================================
// ICONS (inline SVG)
// ============================================================

const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconPlay = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconClock = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconVolume = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const IconSkull = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 3.54 1.84 6.65 4.6 8.47V22h10.8v-1.53C20.16 18.65 22 15.54 22 12c0-5.52-4.48-10-10-10z" />
    <path d="M9 17v1M15 17v1M9 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0M13 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
  </svg>
);

const IconSettings = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ============================================================
// CONFIG PAGE
// ============================================================
export default function ConfigPage() {
  const {
    selectedBosses, toggleBoss, selectAll, selectNone,
    bossAlerts, toggleBossAlert, getBossAlerts,
    globalAlerts, toggleGlobalAlert, setAllGlobalAlerts,
    ttsVolume, setTtsVolume,
  } = useBossStore();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [countdown, setCountdown] = useState<Record<string, number>>({});
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  // Live countdown ticker (updates each second for preview)
  useEffect(() => {
    const tick = () => {
      const next: Record<string, number> = {};
      bosses.forEach((b) => {
        next[b.id] = getNextSpawnTime(b.schedules).diffSeconds;
      });
      setCountdown(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Load TTS voices
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const pt = all.filter((v) => v.lang.startsWith("pt"));
      setVoices(pt.length > 0 ? pt : all.slice(0, 5));
      const saved = localStorage.getItem("tbs-voice");
      if (saved) setSelectedVoice(saved);
      else if (pt.length > 0) {
        setSelectedVoice(pt[0].name);
        localStorage.setItem("tbs-voice", pt[0].name);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const handleOpenOverlay = async () => {
    try {
      await invoke("open_overlay");
      setOverlayOpen(true);
    } catch (e) {
      console.error("Failed to open overlay:", e);
    }
  };

  const handleCloseOverlay = async () => {
    try {
      await invoke("close_overlay");
      setOverlayOpen(false);
    } catch (e) {
      console.error("Failed to close overlay:", e);
    }
  };

  const testVoice = () => {
    const utter = new SpeechSynthesisUtterance("TimerBoss ativo. Valento vai nascer em 5 minutos.");
    utter.lang = "pt-BR";
    utter.volume = ttsVolume;
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utter.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const nextSpawnBossId = bosses.length > 0
    ? bosses.reduce((closest, b) => {
        const bDiff = countdown[b.id] ?? Infinity;
        const cDiff = countdown[closest.id] ?? Infinity;
        return bDiff < cDiff ? b : closest;
      }, bosses[0])?.id
    : null;

  const sortedBosses = [...bosses].sort((a, b) => {
    const timeA = countdown[a.id] ?? getNextSpawnTime(a.schedules).diffSeconds;
    const timeB = countdown[b.id] ?? getNextSpawnTime(b.schedules).diffSeconds;
    return timeA - timeB;
  });

  const selectedCount = selectedBosses.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      {/* Background glow effects */}
      <div style={{
        position: "fixed", top: "-20%", left: "-15%",
        width: "50%", height: "50%",
        background: "radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "-15%",
        width: "50%", height: "50%",
        background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* HEADER */}
      <header style={{
        position: "relative", zIndex: 1,
        padding: "20px 28px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(10,10,20,0.9)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Logo skull */}

            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.05em", lineHeight: 1.2 }}>
                TIMER<span style={{ color: "var(--accent-rose)" }}>EVENT</span>
              </h1>
              <p style={{ fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
               Skytale DESKTOP OVERLAY (by Genaro)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Selected count badge */}
            <div style={{
              padding: "6px 14px", borderRadius: 20,
              background: selectedCount > 0 ? "var(--accent-active-dim)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${selectedCount > 0 ? "var(--accent-active-border)" : "var(--border-subtle)"}`,
              fontSize: 12, fontWeight: 700,
              color: selectedCount > 0 ? "var(--accent-active)" : "var(--text-muted)",
              transition: "all 0.3s",
            }}>
              {selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}
            </div>

            {/* Select all / none */}
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={selectAll}>Todos</button>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={selectNone}>Nenhum</button>
          </div>
        </div>
      </header>

      {/* CONTROLS BAR */}
      <div style={{
        position: "relative", zIndex: 1,
        padding: "14px 28px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(10,10,20,0.7)",
        backdropFilter: "blur(10px)",
        display: "flex", gap: 16, alignItems: "center",
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        {/* Global alert toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Alertas globais:
          </span>
          <button className="btn btn-ghost"
            style={{ fontSize: 11, padding: "4px 12px" }}
            onClick={() => setAllGlobalAlerts(true)}>Ligar todos</button>
          <button className="btn btn-ghost"
            style={{ fontSize: 11, padding: "4px 12px" }}
            onClick={() => setAllGlobalAlerts(false)}>Desligar todos</button>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginLeft: 4 }}>
            Minutos:
          </span>
          {([2, 5, 10] as AlertMinutes[]).map((m) => {
            const key = `alert${m}m` as keyof typeof globalAlerts;
            const active = globalAlerts[key];
            return (
              <button key={m}
                onClick={() => toggleGlobalAlert(m)}
                style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: active ? "1px solid var(--accent-active-border)" : "1px solid var(--border-subtle)",
                  background: active ? "var(--accent-active-dim)" : "rgba(255,255,255,0.04)",
                  color: active ? "var(--accent-active)" : "var(--text-muted)",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                {m}m
              </button>
            );
          })}
        </div>

        {/* TTS Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <IconVolume size={14} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
            Voz: {Math.round(ttsVolume * 100)}%
          </span>
          <input type="range" min={0} max={1} step={0.05} value={ttsVolume}
            onChange={(e) => setTtsVolume(Number(e.target.value))}
            style={{ width: 80 }} />
          {voices.length > 0 && (
            <select
              value={selectedVoice}
              onChange={(e) => { setSelectedVoice(e.target.value); localStorage.setItem("tbs-voice", e.target.value); }}
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)",
                borderRadius: 8, color: "var(--text-primary)", fontSize: 11,
                padding: "4px 8px", outline: "none",
              }}>
              {voices.map((v) => <option key={v.name} value={v.name}>{v.name.split(" ").slice(0, 2).join(" ")}</option>)}
            </select>
          )}
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }} onClick={testVoice}>
            ▶ Testar
          </button>
        </div>
      </div>

      {/* BOSS LIST */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 28px",
        position: "relative", zIndex: 1,
      }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)"
          }}>
            <IconClock size={16} />
          </div>
          <h2 style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.05em", color: "var(--text-primary)", margin: 0, textTransform: "uppercase" }}>
            Próximos Eventos
          </h2>
        </div>

        {/* Responsive Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
          paddingBottom: "20px"
        }}>
          {sortedBosses.map((boss, idx) => {
            const isSelected = selectedBosses.includes(boss.id);
            const diff = countdown[boss.id] ?? 0;
            const spawnInfo = getNextSpawnTime(boss.schedules);
            const isNext = boss.id === nextSpawnBossId;

            // Formatação do tempo restante (ex: "30 min", "1h 30m")
            const formatFaltam = (sec: number) => {
              if (sec < 0) return "0 min";
              const mins = Math.floor(sec / 60);
              if (mins < 60) return `${mins} min`;
              const hrs = Math.floor(mins / 60);
              const remMins = mins % 60;
              return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
            };

            const cardBgStyle = boss.img
              ? { backgroundImage: `url(${boss.img})` }
              : { background: "linear-gradient(135deg, #1e1e2f 0%, #0f0f1a 100%)" };

            return (
              <div
                key={boss.id}
                onClick={() => toggleBoss(boss.id)}
                style={{
                  position: "relative",
                  height: "220px",
                  borderRadius: "14px",
                  border: isSelected
                    ? "2px solid var(--accent-rose)"
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isSelected
                    ? "0 0 15px var(--accent-rose-dim)"
                    : "none",
                  ...cardBgStyle,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* Gradient Overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(10,10,20,0.2) 0%, rgba(10,10,20,0.5) 45%, rgba(5,5,10,0.92) 100%)",
                  zIndex: 1,
                  pointerEvents: "none"
                }} />

                {/* Top Section */}
                <div style={{
                  position: "relative",
                  zIndex: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "12px",
                  pointerEvents: "none"
                }}>
                  {/* Left: Next Badge */}
                  {isNext ? (
                    <div style={{
                      background: "var(--accent-rose)",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase"
                    }}>
                      PRÓXIMO
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Right: Heart Selection Indicator */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBoss(boss.id);
                    }}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: isSelected ? "var(--accent-rose)" : "rgba(10,10,20,0.6)",
                      border: isSelected ? "none" : "1px solid rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      cursor: "pointer",
                      pointerEvents: "auto",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? "0 0 10px var(--accent-rose-dim)" : "none"
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={isSelected ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>

                {/* Middle Section (Name and Level) */}
                <div style={{
                  position: "relative",
                  zIndex: 2,
                  padding: "0 14px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginTop: "auto",
                  marginBottom: "8px"
                }}>
                  <h3 style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#fff",
                    margin: 0,
                    textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2"
                  }}>
                    {boss.name}
                  </h3>

                  {boss.level && (
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "rgba(255, 255, 255, 0.7)",
                      whiteSpace: "nowrap"
                    }}>
                      LV. {boss.level}
                    </span>
                  )}
                </div>

                {/* Bottom Section */}
                <div style={{
                  position: "relative",
                  zIndex: 2,
                  background: "rgba(10, 10, 20, 0.75)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                  padding: "10px 14px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  {/* Left Column: Horários */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.08em"
                    }}>
                      HORÁRIOS DO DIA
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {boss.schedules.map((t) => {
                        const isNextSpawn = t === spawnInfo.time;
                        return (
                          <span
                            key={t}
                            style={{
                              fontSize: "10px",
                              fontWeight: isNextSpawn ? 800 : 500,
                              padding: "2px 5px",
                              borderRadius: "4px",
                              background: isNextSpawn ? "var(--accent-rose)" : "rgba(255,255,255,0.06)",
                              border: isNextSpawn ? "1px solid var(--accent-rose)" : "1px solid rgba(255,255,255,0.1)",
                              color: isNextSpawn ? "#fff" : "rgba(255,255,255,0.6)",
                            }}
                          >
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Faltam */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.08em"
                    }}>
                      FALTAM
                    </span>
                    <div style={{
                      background: isNext
                        ? "rgba(225, 29, 72, 0.18)"
                        : "rgba(16, 185, 129, 0.15)",
                      border: `1px solid ${isNext ? "rgba(225, 29, 72, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                      color: isNext ? "#f87171" : "#10b981",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.02em"
                    }}>
                      {formatFaltam(diff)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER — Start Overlay Button */}
      <div style={{
        position: "relative", zIndex: 1,
        padding: "16px 28px",
        borderTop: "1px solid var(--border-subtle)",
        background: "rgba(10,10,20,0.95)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
        display: "flex", gap: 12, alignItems: "center",
      }}>
        <div style={{ flex: 1 }}>
          {selectedCount === 0 && (
            <p style={{ fontSize: 12, color: "var(--accent-rose)", fontWeight: 600 }}>
              ⚠ Selecione pelo menos um boss para iniciar o overlay
            </p>
          )}
          {selectedCount > 0 && (
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {selectedCount} boss{selectedCount !== 1 ? "es" : ""} selecionado{selectedCount !== 1 ? "s" : ""} para o overlay
            </p>
          )}
        </div>

        {overlayOpen && (
          <button className="btn btn-ghost" onClick={handleCloseOverlay}
            style={{ minWidth: 140 }}>
            ✕ Fechar Overlay
          </button>
        )}

        <button
          className="btn btn-active"
          disabled={selectedCount === 0}
          onClick={overlayOpen ? handleCloseOverlay : handleOpenOverlay}
          style={{
            minWidth: 200, padding: "14px 28px", fontSize: 15, borderRadius: 14,
            opacity: selectedCount === 0 ? 0.4 : 1,
            cursor: selectedCount === 0 ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            boxShadow: selectedCount > 0 ? "0 0 30px var(--accent-active-glow)" : "none",
          }}>

          {overlayOpen ? "Overlay Ativo" : "  Ligar Overlay"}
        </button>
      </div>
    </div>
  );
}
