import { useEffect, useState } from "react";
import ConfigPage from "./pages/ConfigPage";
import OverlayPage from "./pages/OverlayPage";

export default function App() {
  const [page, setPage] = useState<"config" | "overlay" | null>(null);

  useEffect(() => {
    const detectWindow = async () => {
      // 1. Check global var set by overlay.html
      if ((window as unknown as Record<string, unknown>).__TAURI_WINDOW__ === "overlay") {
        setPage("overlay");
        return;
      }

      // 2. Try Tauri window label
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();
        if (win.label === "overlay") {
          setPage("overlay");
          return;
        }
      } catch {
        // not in Tauri context (browser dev)
      }

      // 3. Fallback: check URL
      if (window.location.pathname.includes("overlay")) {
        setPage("overlay");
        return;
      }

      setPage("config");
    };

    detectWindow();
  }, []);

  if (page === null) {
    // Loading state
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0a0a14", color: "rgba(255,255,255,0.4)",
        fontSize: 13, fontFamily: "Inter, sans-serif",
      }}>
        ☠ Carregando TimerBoss...
      </div>
    );
  }

  return page === "overlay" ? <OverlayPage /> : <ConfigPage />;
}
