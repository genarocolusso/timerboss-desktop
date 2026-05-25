import { useEffect, useState } from "react";

import ConfigPage from "./pages/ConfigPage";
import OverlayPage from "./pages/OverlayPage";

import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";

export default function App() {
  const [page, setPage] = useState<"config" | "overlay" | null>(null);

  // ============================================================
  // AUTO UPDATE
  // ============================================================
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // only check updater in tauri
        if (!(window as unknown as Record<string, unknown>).__TAURI__) {
          return;
        }

        const update = await check();

        if (!update) {
          console.log("Nenhuma atualização encontrada");
          return;
        }

        console.log("Nova versão disponível:", update.version);

        const shouldUpdate = await ask(
          `Nova versão ${update.version} disponível!\n\nDeseja baixar e instalar agora?`,
          {
            title: "Atualização disponível",
            kind: "info",
          }
        );

        if (!shouldUpdate) return;

        // optional message
        await message(
          "Baixando atualização...\nO aplicativo irá reiniciar automaticamente.",
          {
            title: "Atualizando",
            kind: "info",
          }
        );

        // download + install
        await update.downloadAndInstall();

        // restart app
        window.location.reload();
      } catch (err) {
        console.error("Erro no updater:", err);
      }
    };

    // delay pequeno para não travar startup
    const timeout = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  // ============================================================
  // WINDOW DETECTION
  // ============================================================
  useEffect(() => {
    const detectWindow = async () => {
      // 1. Check global var set by overlay.html
      if (
        (window as unknown as Record<string, unknown>).__TAURI_WINDOW__ ===
        "overlay"
      ) {
        setPage("overlay");
        return;
      }

      // 2. Try Tauri window label
      try {
        const { getCurrentWindow } = await import(
          "@tauri-apps/api/window"
        );

        const win = getCurrentWindow();

        if (win.label === "overlay") {
          setPage("overlay");
          return;
        }
      } catch {
        // browser dev mode
      }

      // 3. Fallback: URL
      if (window.location.pathname.includes("overlay")) {
        setPage("overlay");
        return;
      }

      setPage("config");
    };

    detectWindow();
  }, []);

  // ============================================================
  // LOADING
  // ============================================================
  if (page === null) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0a0a14",
          color: "rgba(255,255,255,0.4)",
          fontSize: 13,
          fontFamily: "Inter, sans-serif",
        }}
      >
        ☠ Carregando TimerBoss...
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return page === "overlay" ? (
    <OverlayPage />
  ) : (
    <ConfigPage />
  );
}