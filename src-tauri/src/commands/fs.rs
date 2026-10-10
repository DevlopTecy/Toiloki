use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::SystemTime;

static SESSION_TEMP_DIR: OnceLock<PathBuf> = OnceLock::new();

fn get_session_temp_dir() -> &'static PathBuf {
    SESSION_TEMP_DIR.get_or_init(|| {
        let temp_base = std::env::temp_dir().join("Toiloki-Temp");
        let session_id = format!("session_{}_{}", chrono::Utc::now().timestamp_millis(), hex::encode(rand_bytes(4)));
        let session_dir = temp_base.join(session_id);
        let _ = fs::create_dir_all(&session_dir);
        session_dir
    })
}

fn rand_bytes(count: usize) -> Vec<u8> {
    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
    let mut bytes = Vec::with_capacity(count);
    for i in 0..count {
        bytes.push(((seed >> (i * 8)) & 0xFF) as u8);
    }
    bytes
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReadBufferResult {
    pub success: bool,
    pub data: Option<Vec<u8>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReadTextResult {
    pub success: bool,
    pub text: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WriteResult {
    pub success: bool,
    #[serde(rename = "bytesWritten")]
    pub bytes_written: Option<usize>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileStats {
    pub exists: bool,
    pub size: Option<u64>,
    pub birthtime: Option<String>,
    pub mtime: Option<String>,
    #[serde(rename = "isDirectory")]
    pub is_directory: Option<bool>,
    pub name: Option<String>,
    pub ext: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TempFileResult {
    pub success: bool,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FsDeleteResult {
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn fs_read_file_buffer(file_path: String) -> Result<ReadBufferResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(ReadBufferResult {
            success: false,
            data: None,
            error: Some("File does not exist".to_string()),
        });
    }

    match fs::read(path) {
        Ok(bytes) => Ok(ReadBufferResult {
            success: true,
            data: Some(bytes),
            error: None,
        }),
        Err(e) => Ok(ReadBufferResult {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn fs_read_file_text(file_path: String) -> Result<ReadTextResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(ReadTextResult {
            success: false,
            text: None,
            error: Some("File does not exist".to_string()),
        });
    }

    match fs::read_to_string(path) {
        Ok(text) => Ok(ReadTextResult {
            success: true,
            text: Some(text),
            error: None,
        }),
        Err(e) => Ok(ReadTextResult {
            success: false,
            text: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn fs_write_file_buffer(file_path: String, buffer_data: Vec<u8>) -> Result<WriteResult, String> {
    let path = Path::new(&file_path);
    if let Some(parent) = path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Ok(WriteResult {
                success: false,
                bytes_written: None,
                error: Some(format!("Failed to create parent directory: {}", e)),
            });
        }
    }

    let len = buffer_data.len();
    match fs::write(path, buffer_data) {
        Ok(_) => Ok(WriteResult {
            success: true,
            bytes_written: Some(len),
            error: None,
        }),
        Err(e) => Ok(WriteResult {
            success: false,
            bytes_written: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn fs_write_file_text(file_path: String, text: String) -> Result<WriteResult, String> {
    let path = Path::new(&file_path);
    if let Some(parent) = path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Ok(WriteResult {
                success: false,
                bytes_written: None,
                error: Some(format!("Failed to create parent directory: {}", e)),
            });
        }
    }

    let len = text.len();
    match fs::write(path, text.as_bytes()) {
        Ok(_) => Ok(WriteResult {
            success: true,
            bytes_written: Some(len),
            error: None,
        }),
        Err(e) => Ok(WriteResult {
            success: false,
            bytes_written: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub fn fs_get_stats(file_path: String) -> Result<FileStats, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(FileStats {
            exists: false,
            size: None,
            birthtime: None,
            mtime: None,
            is_directory: None,
            name: None,
            ext: None,
            error: None,
        });
    }

    match fs::metadata(path) {
        Ok(meta) => {
            let mtime_str = meta.modified().ok().and_then(|t| {
                t.duration_since(SystemTime::UNIX_EPOCH).ok().map(|d| {
                    chrono::DateTime::from_timestamp(d.as_secs() as i64, d.subsec_nanos())
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default()
                })
            });

            let birthtime_str = meta.created().ok().and_then(|t| {
                t.duration_since(SystemTime::UNIX_EPOCH).ok().map(|d| {
                    chrono::DateTime::from_timestamp(d.as_secs() as i64, d.subsec_nanos())
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default()
                })
            });

            let name = path.file_name().map(|n| n.to_string_lossy().to_string());
            let ext = path.extension().map(|e| format!(".{}", e.to_string_lossy()));

            Ok(FileStats {
                exists: true,
                size: Some(meta.len()),
                birthtime: birthtime_str,
                mtime: mtime_str,
                is_directory: Some(meta.is_dir()),
                name,
                ext,
                error: None,
            })
        }
        Err(e) => Ok(FileStats {
            exists: false,
            size: None,
            birthtime: None,
            mtime: None,
            is_directory: None,
            name: None,
            ext: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn fs_create_temp_file(buffer_data: Vec<u8>, extension: Option<String>) -> Result<TempFileResult, String> {
    let session_dir = get_session_temp_dir();
    let ext = extension.unwrap_or_else(|| "tmp".to_string()).trim_start_matches('.').to_string();
    let file_name = format!("toiloki_{}_{}.{}", chrono::Utc::now().timestamp_millis(), hex::encode(rand_bytes(3)), ext);
    let target_path = session_dir.join(file_name);

    match fs::write(&target_path, buffer_data) {
        Ok(_) => Ok(TempFileResult {
            success: true,
            file_path: Some(target_path.to_string_lossy().to_string()),
            error: None,
        }),
        Err(e) => Ok(TempFileResult {
            success: false,
            file_path: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn fs_delete_temp_file(file_path: String) -> Result<FsDeleteResult, String> {
    let path = Path::new(&file_path);
    let temp_base = std::env::temp_dir().join("Toiloki-Temp");
    
    // Security check: Must reside within Toiloki-Temp
    if !path.starts_with(&temp_base) {
        return Ok(FsDeleteResult {
            success: false,
            error: Some("Access denied: Path is outside Toiloki temporary directory".to_string()),
        });
    }

    if path.exists() {
        if let Err(e) = fs::remove_file(path) {
            return Ok(FsDeleteResult {
                success: false,
                error: Some(e.to_string()),
            });
        }
    }

    Ok(FsDeleteResult {
        success: true,
        error: None,
    })
}

pub fn clean_all_session_temp() {
    let session_dir = get_session_temp_dir();
    if session_dir.exists() {
        let _ = fs::remove_dir_all(session_dir);
    }
}
