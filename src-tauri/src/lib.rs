// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn open_overlay(app: tauri::AppHandle) {
    if let Some(existing) = app.get_webview_window("overlay") {
        let _ = existing.show();
        let _ = existing.set_focus();
        return;
    }

    let _overlay = WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App("overlay.html".into()))
        .title("TimerBoss Overlay")
        .inner_size(900.0, 110.0)
        .min_inner_size(400.0, 90.0)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .always_on_top(true)
        .resizable(true)
        .skip_taskbar(true)
        .build()
        .expect("Failed to create overlay window");
}

#[tauri::command]
fn close_overlay(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn set_overlay_always_on_top(app: tauri::AppHandle, always_on_top: bool) {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.set_always_on_top(always_on_top);
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            open_overlay,
            close_overlay,
            set_overlay_always_on_top
        ])
        .setup(|app| {
            // Main config window
            let main_window = app.get_webview_window("main").unwrap();
            let _ = main_window.set_title("TimerBoss — Configurações");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
