pub mod commands;

use commands::dialog::*;
use commands::engine::*;
use commands::fs::*;
use commands::shell::*;
use commands::wallpaper::*;
use commands::window::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Window controls
            window_minimize,
            window_maximize,
            window_close,
            window_is_maximized,
            window_set_progress,
            window_flash_frame,
            // Native Dialogs
            dialog_open_file,
            dialog_save_file,
            // File System
            fs_read_file_buffer,
            fs_read_file_text,
            fs_write_file_buffer,
            fs_write_file_text,
            fs_get_stats,
            fs_create_temp_file,
            fs_delete_temp_file,
            // Shell
            shell_show_in_folder,
            shell_open_path,
            // Wallpaper
            bg_pick_image,
            bg_remove_image,
            // Native Rust Engines
            engine_compute_sha256,
            engine_compute_multi_hash,
            engine_batch_hash_files,
            engine_get_system_stats,
            engine_batch_rename_preview,
        ])
        .build(tauri::generate_context!())
        .expect("error while running Toiloki Tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                // Clean temp session folder on application exit
                commands::fs::clean_all_session_temp();
            }
        });
}
