// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use fastembed::{TextEmbedding, InitOptions, EmbeddingModel};
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub model: Mutex<Option<TextEmbedding>>,
}

#[tauri::command]
async fn get_embedding(text: String, state: State<'_, AppState>) -> Result<Vec<f32>, String> {
    let mut model_lock = state.model.lock().map_err(|e| e.to_string())?;
    
    if model_lock.is_none() {
        // Initialize model on first use
        let mut options = InitOptions::default();
        options.model_name = EmbeddingModel::BGESmallENV15;
        options.show_download_progress = true;
        
        let model = TextEmbedding::try_new(options)
            .map_err(|e| e.to_string())?;
        *model_lock = Some(model);
    }

    let model = model_lock.as_ref().unwrap();
    let embeddings = model.embed(vec![text], None).map_err(|e| e.to_string())?;
    Ok(embeddings[0].clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(AppState {
        model: Mutex::new(None),
    })
    .invoke_handler(tauri::generate_handler![get_embedding])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
