use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct FilterOption {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct OpenDialogOptions {
    pub title: Option<String>,
    pub filters: Option<Vec<FilterOption>>,
    pub properties: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct OpenDialogResult {
    pub canceled: bool,
    #[serde(rename = "filePaths")]
    pub file_paths: Vec<String>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct SaveDialogOptions {
    pub title: Option<String>,
    #[serde(rename = "defaultPath")]
    pub default_path: Option<String>,
    pub filters: Option<Vec<FilterOption>>,
}

#[derive(Debug, Serialize)]
pub struct SaveDialogResult {
    pub canceled: bool,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn dialog_open_file(options: Option<OpenDialogOptions>) -> Result<OpenDialogResult, String> {
    let opts = options.unwrap_or_default();
    let mut dialog = rfd::AsyncFileDialog::new();

    if let Some(ref title) = opts.title {
        dialog = dialog.set_title(title);
    }

    if let Some(ref filters) = opts.filters {
        for f in filters {
            let exts: Vec<&str> = f.extensions.iter().map(|s| s.trim_start_matches('.')).collect();
            dialog = dialog.add_filter(&f.name, &exts);
        }
    }

    let is_multiple = opts
        .properties
        .as_ref()
        .map(|p| p.iter().any(|x| x == "multiSelections"))
        .unwrap_or(false);

    if is_multiple {
        let files = dialog.pick_files().await;
        match files {
            Some(handles) => {
                let paths = handles
                    .into_iter()
                    .map(|h| h.path().to_string_lossy().to_string())
                    .collect();
                Ok(OpenDialogResult {
                    canceled: false,
                    file_paths: paths,
                    error: None,
                })
            }
            None => Ok(OpenDialogResult {
                canceled: true,
                file_paths: vec![],
                error: None,
            }),
        }
    } else {
        let file = dialog.pick_file().await;
        match file {
            Some(handle) => Ok(OpenDialogResult {
                canceled: false,
                file_paths: vec![handle.path().to_string_lossy().to_string()],
                error: None,
            }),
            None => Ok(OpenDialogResult {
                canceled: true,
                file_paths: vec![],
                error: None,
            }),
        }
    }
}

#[tauri::command]
pub async fn dialog_save_file(options: Option<SaveDialogOptions>) -> Result<SaveDialogResult, String> {
    let opts = options.unwrap_or_default();
    let mut dialog = rfd::AsyncFileDialog::new();

    if let Some(ref title) = opts.title {
        dialog = dialog.set_title(title);
    }

    if let Some(ref default_path) = opts.default_path {
        let p = std::path::Path::new(default_path);
        if let Some(parent) = p.parent() {
            dialog = dialog.set_directory(parent);
        }
        if let Some(name) = p.file_name() {
            dialog = dialog.set_file_name(&name.to_string_lossy());
        }
    }

    if let Some(ref filters) = opts.filters {
        for f in filters {
            let exts: Vec<&str> = f.extensions.iter().map(|s| s.trim_start_matches('.')).collect();
            dialog = dialog.add_filter(&f.name, &exts);
        }
    }

    let file = dialog.save_file().await;
    match file {
        Some(handle) => Ok(SaveDialogResult {
            canceled: false,
            file_path: Some(handle.path().to_string_lossy().to_string()),
            error: None,
        }),
        None => Ok(SaveDialogResult {
            canceled: true,
            file_path: None,
            error: None,
        }),
    }
}
