import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AlertMinutes = 2 | 5 | 10;
export type OverlayOrientation = "horizontal" | "vertical";

interface BossAlertSettings {
  alert2m: boolean;
  alert5m: boolean;
  alert10m: boolean;
}

interface BossStore {
  // Which bosses are selected for the overlay
  selectedBosses: string[];
  toggleBoss: (id: string) => void;
  selectAll: () => void;
  selectNone: () => void;

  // Per-boss alert settings
  bossAlerts: Record<string, BossAlertSettings>;
  toggleBossAlert: (id: string, minutes: AlertMinutes) => void;
  getBossAlerts: (id: string) => BossAlertSettings;

  // Global alert settings
  globalAlerts: {
    alert2m: boolean;
    alert5m: boolean;
    alert10m: boolean;
  };
  toggleGlobalAlert: (minutes: AlertMinutes) => void;
  setAllGlobalAlerts: (value: boolean) => void;

  // Overlay display settings
  overlayOrientation: OverlayOrientation;
  setOverlayOrientation: (o: OverlayOrientation) => void;

  overlayScale: number;
  setOverlayScale: (s: number) => void;

  overlayOpacity: number;
  setOverlayOpacity: (o: number) => void;

  // TTS volume
  ttsVolume: number;
  setTtsVolume: (v: number) => void;

  // Timezone
  timezoneOffset: number;
  setTimezoneOffset: (offset: number) => void;
}

const DEFAULT_ALERT: BossAlertSettings = {
  alert2m: true,
  alert5m: true,
  alert10m: false,
};

export const useBossStore = create<BossStore>()(
  persist(
    (set, get) => ({
      selectedBosses: ["valento", "mokova", "kelvezu", "furia"],
      toggleBoss: (id) => {
        const { selectedBosses } = get();
        set({
          selectedBosses: selectedBosses.includes(id)
            ? selectedBosses.filter((b) => b !== id)
            : [...selectedBosses, id],
        });
      },
      selectAll: () => {
        // Will be patched with all boss IDs
        const { bosses } = get() as unknown as { bosses: { id: string }[] };
        void bosses;
        set({ selectedBosses: ["valento", "babel2", "furia", "kelvezu", "babel1", "mokova", "colossus", "hellgate", "arena"] });
      },
      selectNone: () => set({ selectedBosses: [] }),

      bossAlerts: {},
      toggleBossAlert: (id, minutes) => {
        const current = get().getBossAlerts(id);
        const key = `alert${minutes}m` as keyof BossAlertSettings;
        set({
          bossAlerts: {
            ...get().bossAlerts,
            [id]: { ...current, [key]: !current[key] },
          },
        });
      },
      getBossAlerts: (id) => {
        return get().bossAlerts[id] ?? { ...DEFAULT_ALERT };
      },

      globalAlerts: { alert2m: false, alert5m: true, alert10m: true },
      toggleGlobalAlert: (minutes) => {
        const key = `alert${minutes}m` as keyof BossStore["globalAlerts"];
        set({ globalAlerts: { ...get().globalAlerts, [key]: !get().globalAlerts[key] } });
      },
      setAllGlobalAlerts: (value) => {
        set({ globalAlerts: { alert2m: value, alert5m: value, alert10m: value } });
      },

      overlayOrientation: "horizontal",
      setOverlayOrientation: (o) => set({ overlayOrientation: o }),

      overlayScale: 100,
      setOverlayScale: (s) => set({ overlayScale: Math.min(150, Math.max(60, s)) }),

      overlayOpacity: 85,
      setOverlayOpacity: (o) => set({ overlayOpacity: Math.min(100, Math.max(20, o)) }),

      ttsVolume: 0.5,
      setTtsVolume: (v) => set({ ttsVolume: v }),

      timezoneOffset: -3,
      setTimezoneOffset: (offset) => set({ timezoneOffset: offset }),
    }),
    {
      name: "timerboss-desktop-store",
    }
  )
);
