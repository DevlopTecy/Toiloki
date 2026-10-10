use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256, Sha512};
use std::fs::File;
use std::io::{BufReader, Read};
use std::path::Path;
use sysinfo::System;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileHashResult {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub hash: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MultiHashResult {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub sha256: String,
    pub sha512: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub total_memory_mb: u64,
    pub used_memory_mb: u64,
    pub free_memory_mb: u64,
    pub memory_percentage: f32,
    pub cpu_count: usize,
    pub cpu_usage_percentage: f32,
    pub os_name: String,
    pub os_version: String,
    pub host_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RenamePreview {
    pub original: String,
    pub proposed: String,
    pub has_changed: bool,
}

#[tauri::command]
pub async fn engine_compute_sha256(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    tokio::task::spawn_blocking(move || {
        let file = File::open(path).map_err(|e| e.to_string())?;
        let mut reader = BufReader::with_capacity(128 * 1024, file);
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 64 * 1024];

        loop {
            let bytes_read = reader.read(&mut buffer).map_err(|e| e.to_string())?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        Ok(hex::encode(hasher.finalize()))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn engine_compute_multi_hash(file_path: String) -> Result<MultiHashResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let p_clone = file_path.clone();
    tokio::task::spawn_blocking(move || {
        let p = Path::new(&p_clone);
        let name = p.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
        let size = p.metadata().map(|m| m.len()).unwrap_or(0);
        let file = File::open(p).map_err(|e| e.to_string())?;
        let mut reader = BufReader::with_capacity(128 * 1024, file);
        let mut hasher256 = Sha256::new();
        let mut hasher512 = Sha512::new();
        let mut buffer = [0u8; 64 * 1024];

        loop {
            let bytes_read = reader.read(&mut buffer).map_err(|e| e.to_string())?;
            if bytes_read == 0 {
                break;
            }
            hasher256.update(&buffer[..bytes_read]);
            hasher512.update(&buffer[..bytes_read]);
        }

        Ok(MultiHashResult {
            path: p_clone,
            name,
            size,
            sha256: hex::encode(hasher256.finalize()),
            sha512: hex::encode(hasher512.finalize()),
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn engine_batch_hash_files(file_paths: Vec<String>) -> Result<Vec<FileHashResult>, String> {
    tokio::task::spawn_blocking(move || {
        let results: Vec<FileHashResult> = file_paths
            .par_iter()
            .map(|p| {
                let path = Path::new(p);
                let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                let size = path.metadata().map(|m| m.len()).unwrap_or(0);

                let file = match File::open(path) {
                    Ok(f) => f,
                    Err(e) => {
                        return FileHashResult {
                            path: p.clone(),
                            name,
                            size,
                            hash: None,
                            error: Some(e.to_string()),
                        }
                    }
                };

                let mut reader = BufReader::with_capacity(64 * 1024, file);
                let mut hasher = Sha256::new();
                let mut buffer = [0u8; 32 * 1024];

                let mut read_failed = false;
                let mut err_msg = String::new();

                loop {
                    match reader.read(&mut buffer) {
                        Ok(0) => break,
                        Ok(n) => hasher.update(&buffer[..n]),
                        Err(e) => {
                            read_failed = true;
                            err_msg = e.to_string();
                            break;
                        }
                    }
                }

                if read_failed {
                    FileHashResult {
                        path: p.clone(),
                        name,
                        size,
                        hash: None,
                        error: Some(err_msg),
                    }
                } else {
                    FileHashResult {
                        path: p.clone(),
                        name,
                        size,
                        hash: Some(hex::encode(hasher.finalize())),
                        error: None,
                    }
                }
            })
            .collect();

        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn engine_get_system_stats() -> Result<SystemStats, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_mem = sys.total_memory() / (1024 * 1024);
    let used_mem = sys.used_memory() / (1024 * 1024);
    let free_mem = total_mem.saturating_sub(used_mem);
    let mem_pct = if total_mem > 0 {
        (used_mem as f32 / total_mem as f32) * 100.0
    } else {
        0.0
    };

    let cpu_pct = sys.global_cpu_info().cpu_usage();

    Ok(SystemStats {
        total_memory_mb: total_mem,
        used_memory_mb: used_mem,
        free_memory_mb: free_mem,
        memory_percentage: mem_pct,
        cpu_count: sys.cpus().len(),
        cpu_usage_percentage: cpu_pct,
        os_name: System::name().unwrap_or_else(|| "Windows".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "11/10".to_string()),
        host_name: System::host_name().unwrap_or_else(|| "localhost".to_string()),
    })
}

#[tauri::command]
pub fn engine_batch_rename_preview(
    files: Vec<String>,
    prefix: String,
    suffix: String,
    find_str: String,
    replace_str: String,
    start_number: usize,
    pad_zeros: usize,
) -> Result<Vec<RenamePreview>, String> {
    let mut previews = Vec::with_capacity(files.len());

    for (idx, original) in files.into_iter().enumerate() {
        let path = Path::new(&original);
        let stem = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let ext = path
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();

        let mut base_name = stem;
        if !find_str.is_empty() {
            base_name = base_name.replace(&find_str, &replace_str);
        }

        let num = start_number + idx;
        let num_str = if pad_zeros > 0 {
            format!("{:0width$}", num, width = pad_zeros)
        } else {
            num.to_string()
        };

        let final_stem = format!("{}{}{}{}", prefix, base_name, suffix, if pad_zeros > 0 || start_number > 0 { format!("_{}", num_str) } else { String::new() });
        let proposed = format!("{}{}", final_stem, ext);
        let has_changed = proposed != original;

        previews.push(RenamePreview {
            original,
            proposed,
            has_changed,
        });
    }

    Ok(previews)
}
