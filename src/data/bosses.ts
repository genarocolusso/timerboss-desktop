// Mapa de imagens dos bosses (usando import dinâmico para assets locais)
export interface BossEvent {
  time: string;
  evento: string;
  level: string | null;
}

export interface Boss {
  id: string;
  name: string;
  img: string | null; // null = sem imagem disponível
  level: string | null;
  schedules: string[]; // todos os horários do dia
}

// ============================================================
// EVENTOS COMPLETOS (igual ao EventBossPage)
// ============================================================
export const allEvents: BossEvent[] = [
  { time: "00:30", evento: "Valento Ice 1", level: "90+" },
  { time: "01:30", evento: "Babel Iron 2", level: "85+" },
  { time: "02:30", evento: "Fúria Cofre de Ric", level: "85+" },
  { time: "07:30", evento: "Babel Iron 2", level: "85+" },
  { time: "08:30", evento: "Fúria Cofre de Ric", level: "85+" },
  { time: "09:30", evento: "Valento Ice 1", level: "90+" },
  { time: "10:30", evento: "Kelvezu", level: "95+" },
  { time: "11:30", evento: "Babel Iron 1", level: "80" },
  { time: "11:30", evento: "Mokova", level: "100+" },
  { time: "12:30", evento: "World Boss Colossus", level: "55+" },
  { time: "13:30", evento: "Fúria Cofre de Ric", level: "85+" },
  { time: "13:30", evento: "Valento Ice 1", level: "90+" },
  { time: "14:00", evento: "Hell Gate", level: null },
  { time: "15:00", evento: "Arena PVP", level: null },
  { time: "16:30", evento: "Kelvezu", level: "95+" },
  { time: "16:30", evento: "Babel Iron 1", level: "85+" },
  { time: "17:30", evento: "World Boss Colossus", level: "55+" },
  { time: "17:30", evento: "Fúria Cofre de Ric", level: "85+" },
  { time: "18:30", evento: "Babel Iron 2", level: "85+" },
  { time: "19:30", evento: "Valento Ice 1", level: "90+" },
  { time: "20:00", evento: "Hell Gate", level: null },
  { time: "20:30", evento: "Kelvezu", level: "95+" },
  { time: "20:30", evento: "Fúria Cofre de Ric", level: "85+" },
  { time: "20:30", evento: "Babel Iron 1", level: "80" },
  { time: "21:00", evento: "Arena PVP", level: null },
  { time: "21:30", evento: "Mokova", level: "100+" },
  { time: "21:30", evento: "Valento Ice 1", level: "90+" },
  { time: "22:30", evento: "World Boss Colossus", level: "55+" },
  { time: "22:30", evento: "Babel Iron 2", level: "85+" },
  { time: "23:30", evento: "Fúria Cofre de Ric", level: "85+" },
  { time: "23:30", evento: "Kelvezu", level: "95+" },
];

// ============================================================
// BOSSES ÚNICOS (agrupados)
// ============================================================
export const bosses: Boss[] = [
  {
    id: "valento",
    name: "Valento Ice 1",
    img: "/assets/boss/valento.png",
    level: "90+",
    schedules: ["00:30", "09:30", "13:30", "19:30", "21:30"],
  },
  {
    id: "babel2",
    name: "Babel Iron 2",
    img: "/assets/boss/babel.png",
    level: "85+",
    schedules: ["01:30", "07:30", "18:30", "22:30"],
  },
  {
    id: "furia",
    name: "Fúria Cofre de Ric",
    img: "/assets/boss/furia.png",
    level: "85+",
    schedules: ["02:30", "08:30", "13:30", "17:30", "20:30", "23:30"],
  },
  {
    id: "kelvezu",
    name: "Kelvezu",
    img: "/assets/boss/kelvezu.png",
    level: "95+",
    schedules: ["10:30", "16:30", "20:30", "23:30"],
  },
  
  {
    id: "Skullor",
    name: "Skullor",
    img: null,
    level: "105+",
    schedules: ["19:30"],
  },
  {
    id: "babel1",
    name: "Babel Iron 1",
    img: "/assets/boss/babel.png",
    level: "80-85+",
    schedules: ["11:30", "16:30", "20:30"],
  },
  {
    id: "mokova",
    name: "Mokova",
    img: "/assets/boss/mokova.png",
    level: "100+",
    schedules: ["11:30", "21:30"],
  },
  {
    id: "colossus",
    name: "World Boss Colossus",
    img: null,
    level: "55+",
    schedules: ["12:30", "17:30", "22:30"],
  },
  {
    id: "hellgate",
    name: "Hell Gate",
    img: null,
    level: null,
    schedules: ["14:00", "20:00"],
  },
  {
    id: "arena",
    name: "Arena PVP",
    img: null,
    level: null,
    schedules: ["15:00", "21:00"],
  },
];

// ============================================================
// HELPERS
// ============================================================
export function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function getNextSpawnTime(schedules: string[]): { time: string; diffSeconds: number } {
  const now = new Date();
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let best: { time: string; diffSeconds: number } | null = null;

  for (const t of schedules) {
    const evSeconds = parseTimeToMinutes(t) * 60;
    const diff = evSeconds >= nowSeconds ? evSeconds - nowSeconds : 86400 - (nowSeconds - evSeconds);
    if (!best || diff < best.diffSeconds) {
      best = { time: t, diffSeconds: diff };
    }
  }

  return best ?? { time: schedules[0], diffSeconds: 0 };
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDiffShort(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
