import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SettingsService } from './core/services/settings.service';
import { initTauriBridge } from './core/platform/tauri-bridge';

// Initialize Tauri Rust bridge if running in Tauri desktop environment
initTauriBridge();

// Sync theme before initial render to prevent flash or mismatched CSS variables
const initialParams = new URLSearchParams(window.location.search);
const initialTheme = initialParams.get('theme');
if (initialTheme) {
  SettingsService.saveSettings({ theme: initialTheme });
} else {
  SettingsService.applyDomSettings(SettingsService.getSettings());
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
