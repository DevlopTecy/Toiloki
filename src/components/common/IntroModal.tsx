import React, { useState } from 'react';
import { X, Moon, Sun, Laptop, Folder, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { SettingsService } from '../../core/services/settings.service';
import { useTheme } from '../../core/theme/ThemeContext';
import './IntroModal.css';

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntroModal: React.FC<IntroModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { setThemeMode, resolvedMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<string>(() => SettingsService.getSettings().theme);
  const [outputDir, setOutputDir] = useState<string>(() => SettingsService.getSettings().outputDir || 'Downloads/Toiloki');

  if (!isOpen) return null;

  const handleFinish = () => {
    localStorage.setItem('toiloki_intro_completed', 'true');
    onClose();
  };

  const handleSelectTheme = (mode: string) => {
    setSelectedTheme(mode);
    setThemeMode(mode as any);
    SettingsService.saveSettings({ theme: mode });
  };

  const handleBrowseDir = async () => {
    const toiloki = (window as any).toiloki;
    if (toiloki?.dialog?.openFile) {
      try {
        const res = await toiloki.dialog.openFile({
          title: 'Select Export Directory',
          properties: ['openDirectory', 'createDirectory'],
        });
        if (!res.canceled && res.filePaths?.[0]) {
          setOutputDir(res.filePaths[0]);
          SettingsService.saveSettings({ outputDir: res.filePaths[0] });
        }
        return;
      } catch (err) {
        console.error('Electron folder dialog error:', err);
      }
    }

    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle?.name) {
          const path = `/${dirHandle.name}`;
          setOutputDir(path);
          SettingsService.saveSettings({ outputDir: path });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Directory picker error:', err);
      }
    }
  };

  return (
    <div className="intro-modal-overlay" role="dialog" aria-modal="true" aria-label="Welcome Tour">
      <div className="intro-modal-card">
        {/* Step indicator bar */}
        <div className="intro-stepper-bar">
          <div className="intro-stepper-steps">
            <span className={`stepper-dot ${step >= 1 ? 'active' : ''}`} />
            <span className="stepper-line" />
            <span className={`stepper-dot ${step >= 2 ? 'active' : ''}`} />
            <span className="stepper-line" />
            <span className={`stepper-dot ${step >= 3 ? 'active' : ''}`} />
          </div>
          <button className="intro-skip-btn" onClick={handleFinish} type="button">
            Skip Intro
          </button>
        </div>

        {/* Step 1: Appearance & Theme */}
        {step === 1 && (
          <div className="intro-step-content">
            <div className="intro-step-header">
              <span className="intro-step-badge">Step 1 of 3</span>
              <h2 className="intro-step-title">Choose your working appearance</h2>
              <p className="intro-step-desc">
                Select your preferred interface aesthetic. Toiloki uses calm, restrained surfaces designed for long focus sessions.
              </p>
            </div>

            <div className="intro-theme-grid">
              <div
                className={`intro-theme-card ${selectedTheme === 'dark' ? 'selected' : ''}`}
                onClick={() => handleSelectTheme('dark')}
              >
                <div className="theme-card-icon-wrap">
                  <Moon size={18} />
                </div>
                <div className="theme-card-title">Dark Neutral</div>
                <div className="theme-card-sub">Restrained charcoal & champagne gold</div>
              </div>

              <div
                className={`intro-theme-card ${selectedTheme === 'light' ? 'selected' : ''}`}
                onClick={() => handleSelectTheme('light')}
              >
                <div className="theme-card-icon-wrap">
                  <Sun size={18} />
                </div>
                <div className="theme-card-title">Pure Light</div>
                <div className="theme-card-sub">Crisp contrast & neutral slate</div>
              </div>

              <div
                className={`intro-theme-card ${selectedTheme === 'system' ? 'selected' : ''}`}
                onClick={() => handleSelectTheme('system')}
              >
                <div className="theme-card-icon-wrap">
                  <Laptop size={18} />
                </div>
                <div className="theme-card-title">System Sync</div>
                <div className="theme-card-sub">Follows OS dark/light schedule</div>
              </div>
            </div>

            <div className="intro-step-actions">
              <button className="intro-primary-btn" onClick={() => setStep(2)} type="button">
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Output Directory */}
        {step === 2 && (
          <div className="intro-step-content">
            <div className="intro-step-header">
              <span className="intro-step-badge">Step 2 of 3</span>
              <h2 className="intro-step-title">Default export destination</h2>
              <p className="intro-step-desc">
                Where should processed files be saved by default? You can always change this per-utility.
              </p>
            </div>

            <div className="intro-dir-box">
              <label className="intro-label">Output Directory</label>
              <div className="intro-dir-input-row">
                <input
                  type="text"
                  className="intro-text-input"
                  value={outputDir}
                  onChange={(e) => {
                    setOutputDir(e.target.value);
                    SettingsService.saveSettings({ outputDir: e.target.value });
                  }}
                />
                <button className="intro-browse-btn" onClick={handleBrowseDir} type="button">
                  <Folder size={14} />
                  <span>Browse</span>
                </button>
              </div>
              <span className="intro-input-helper">
                Files are processed strictly locally. No data ever leaves your computer.
              </span>
            </div>

            <div className="intro-step-actions between">
              <button className="intro-back-btn" onClick={() => setStep(1)} type="button">
                Back
              </button>
              <button className="intro-primary-btn" onClick={() => setStep(3)} type="button">
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Completion */}
        {step === 3 && (
          <div className="intro-step-content">
            <div className="intro-step-header center">
              <div className="intro-complete-icon-wrap">
                <ShieldCheck size={28} />
              </div>
              <span className="intro-step-badge">Ready</span>
              <h2 className="intro-step-title">Your offline workstation is set up</h2>
              <p className="intro-step-desc">
                No accounts, zero telemetry, full offline functionality. Over 100 utilities ready at your fingertips with <kbd className="shortcut-kbd-inline">Ctrl</kbd> + <kbd className="shortcut-kbd-inline">K</kbd>.
              </p>
            </div>

            <div className="intro-features-check-list">
              <div className="check-item">
                <Check size={14} className="check-icon" />
                <span>100% local computation on CPU/GPU</span>
              </div>
              <div className="check-item">
                <Check size={14} className="check-icon" />
                <span>Instant drag-and-drop & smart clipboard paste</span>
              </div>
              <div className="check-item">
                <Check size={14} className="check-icon" />
                <span>Press <kbd className="shortcut-kbd-inline">?</kbd> anytime for keyboard shortcuts</span>
              </div>
            </div>

            <div className="intro-step-actions center">
              <button className="intro-primary-btn large" onClick={handleFinish} type="button">
                <span>Start Using Toiloki</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
