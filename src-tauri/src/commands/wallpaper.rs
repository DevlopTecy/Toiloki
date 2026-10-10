use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct BgPickResult {
    pub canceled: bool,
    #[serde(rename = "fileName")]
    pub file_name: Option<String>,
    pub url: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BgRemoveResult {
    pub success: bool,
    pub error: Option<String>,
}

fn get_backgrounds_dir() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| std::env::temp_dir());
    let dir = base.join("Toiloki").join("backgrounds");
    let _ = fs::create_dir_all(&dir);
    dir
}

#[tauri::command]
pub async fn bg_pick_image() -> Result<BgPickResult, String> {
    let dialog = rfd::AsyncFileDialog::new()
        .set_title("Choose Background Image")
        .add_filter("Images", &["png", "jpg", "jpeg", "webp", "gif"]);

    let file = dialog.pick_file().await;
    match file {
        Some(handle) => {
            let src_path = handle.path();
            let bytes = match fs::read(src_path) {
                Ok(b) => b,
                Err(e) => {
                    return Ok(BgPickResult {
                        canceled: false,
                        file_name: None,
                        url: None,
                        error: Some(e.to_string()),
                    })
                }
            };

            let mut hasher = Sha256::new();
            hasher.update(&bytes);
            let hash = hex::encode(hasher.finalize());
            let short_hash = &hash[..16];

            let ext = src_path
                .extension()
                .map(|e| format!(".{}", e.to_string_lossy()))
                .unwrap_or_else(|| ".jpg".to_string());

            let file_name = format!("bg_{}{}", short_hash, ext);
            let bg_dir = get_backgrounds_dir();
            let dest_path = bg_dir.join(&file_name);

            if !dest_path.exists() {
                if let Err(e) = fs::write(&dest_path, &bytes) {
                    return Ok(BgPickResult {
                        canceled: false,
                        file_name: None,
                        url: None,
                        error: Some(e.to_string()),
                    });
                }
            }

            // Provide data URL for immediate zero-CSP display
            let mime = match ext.as_str() {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "image/jpeg",
            };
            let data_url = format!("data:{};base64,{}", mime, rfd_base64_encode(&bytes));

            Ok(BgPickResult {
                canceled: false,
                file_name: Some(file_name),
                url: Some(data_url),
                error: None,
            })
        }
        None => Ok(BgPickResult {
            canceled: true,
            file_name: None,
            url: None,
            error: None,
        }),
    }
}

#[tauri::command]
pub async fn bg_remove_image(file_name: String) -> Result<BgRemoveResult, String> {
    let bg_dir = get_backgrounds_dir();
    let file_path = bg_dir.join(Path::new(&file_name).file_name().unwrap_or_default());

    if file_path.exists() {
        if let Err(e) = fs::remove_file(file_path) {
            return Ok(BgRemoveResult {
                success: false,
                error: Some(e.to_string()),
            });
        }
    }

    Ok(BgRemoveResult {
        success: true,
        error: None,
    })
}

fn rfd_base64_encode(data: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        out.push(TABLE[(b0 >> 2) as usize] as char);
        out.push(TABLE[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            out.push(TABLE[(((b1 & 0x0F) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(TABLE[(b2 & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}
