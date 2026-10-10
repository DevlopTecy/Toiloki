use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ShellResult {
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn shell_show_in_folder(file_path: String) -> Result<ShellResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(ShellResult {
            success: false,
            error: Some("Target file or folder does not exist".to_string()),
        });
    }

    #[cfg(target_os = "windows")]
    {
        let win_path = file_path.replace('/', "\\");
        let status = Command::new("explorer")
            .arg("/select,")
            .arg(&win_path)
            .status();

        match status {
            Ok(s) if s.success() => Ok(ShellResult {
                success: true,
                error: None,
            }),
            Ok(_) => Ok(ShellResult {
                success: true, // Explorer often returns 1 even when window successfully opens
                error: None,
            }),
            Err(e) => Ok(ShellResult {
                success: false,
                error: Some(e.to_string()),
            }),
        }
    }

    #[cfg(target_os = "macos")]
    {
        let status = Command::new("open").arg("-R").arg(&file_path).status();
        match status {
            Ok(s) => Ok(ShellResult {
                success: s.success(),
                error: None,
            }),
            Err(e) => Ok(ShellResult {
                success: false,
                error: Some(e.to_string()),
            }),
        }
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        let parent = path.parent().unwrap_or(path);
        match open::that(parent) {
            Ok(_) => Ok(ShellResult {
                success: true,
                error: None,
            }),
            Err(e) => Ok(ShellResult {
                success: false,
                error: Some(e.to_string()),
            }),
        }
    }
}

#[tauri::command]
pub async fn shell_open_path(file_path: String) -> Result<ShellResult, String> {
    match open::that(&file_path) {
        Ok(_) => Ok(ShellResult {
            success: true,
            error: None,
        }),
        Err(e) => Ok(ShellResult {
            success: false,
            error: Some(e.to_string()),
        }),
    }
}
