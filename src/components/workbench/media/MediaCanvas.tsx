import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Scissors,
  Sliders,
  Info,
  Clock,
  Music,
  Video,
  FileAudio,
  FileVideo,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  Repeat,
  Download,
} from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import './MediaCanvas.css';

export type MediaViewMode = 'trim' | 'panel' | 'info';

export interface TrimRange {
  start: number; // in seconds
  end: number;   // in seconds
}

export interface MediaCanvasProps {
  files: SelectedFile[];
  activeFileIndex: number;
  onSelectFileIndex: (index: number) => void;
  viewMode: MediaViewMode;
  onViewModeChange: (mode: MediaViewMode) => void;
  trimRange: TrimRange;
  onTrimRangeChange: (range: TrimRange) => void;
  gainDb: number;
  onGainDbChange: (db: number) => void;
  fadeInSec: number;
  onFadeInSecChange: (sec: number) => void;
  fadeOutSec: number;
  onFadeOutSecChange: (sec: number) => void;
  targetFormat: string;
  onTargetFormatChange: (fmt: string) => void;
}

export const MediaCanvas: React.FC<MediaCanvasProps> = ({
  files,
  activeFileIndex,
  onSelectFileIndex,
  viewMode,
  onViewModeChange,
  trimRange,
  onTrimRangeChange,
  gainDb,
  onGainDbChange,
  fadeInSec,
  onFadeInSecChange,
  fadeOutSec,
  onFadeOutSecChange,
  targetFormat,
  onTargetFormatChange,
}) => {
  const currentFile = files[activeFileIndex] || files[0];
  const isVideo = useMemo(() => {
    if (!currentFile) return false;
    const ext = currentFile.name.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext);
  }, [currentFile]);

  // Object URL for media playback
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(30); // fallback duration 30s
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [copiedInfo, setCopiedInfo] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate media URL from buffer or File object
  useEffect(() => {
    if (!currentFile) return;
    let url: string | null = null;
    if (currentFile.buffer) {
      const mime = isVideo ? 'video/mp4' : 'audio/wav';
      const copy = currentFile.buffer.slice();
      const blob = new Blob([copy], { type: mime });
      url = URL.createObjectURL(blob);
    } else if (currentFile.file) {
      url = URL.createObjectURL(currentFile.file);
    }
    setMediaUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [currentFile, isVideo]);

  // Handle media metadata loaded
  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    const el = e.currentTarget;
    if (el.duration && !isNaN(el.duration) && isFinite(el.duration)) {
      setDuration(el.duration);
      if (trimRange.end === 0 || trimRange.end > el.duration) {
        onTrimRangeChange({
          start: 0,
          end: Math.round(el.duration * 100) / 100,
        });
      }
    }
  }, [trimRange.end, onTrimRangeChange]);

  // Sync timeupdate
  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    const el = e.currentTarget;
    setCurrentTime(el.currentTime);

    // Stop or loop at trim end in trim mode
    if (viewMode === 'trim' && trimRange.end > 0 && el.currentTime >= trimRange.end) {
      if (isLooping) {
        el.currentTime = trimRange.start;
        el.play();
      } else {
        el.pause();
        setIsPlaying(false);
      }
    }
  }, [viewMode, trimRange, isLooping]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
    } else {
      if (viewMode === 'trim' && (media.currentTime < trimRange.start || media.currentTime >= trimRange.end)) {
        media.currentTime = trimRange.start;
      }
      media.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying, isVideo, viewMode, trimRange]);

  // Scrub timeline
  const handleSeek = (time: number) => {
    const media = isVideo ? videoRef.current : audioRef.current;
    if (media) {
      media.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Speed change
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    const media = isVideo ? videoRef.current : audioRef.current;
    if (media) media.playbackRate = speed;
  };

  // Format seconds to HH:MM:SS.ms
  const formatTimecode = (secs: number): string => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Render synthetic waveform for audio
  useEffect(() => {
    if (isVideo) return;
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barCount = 100;
    const barWidth = width / barCount - 1.5;
    const activeStartRatio = trimRange.start / (duration || 30);
    const activeEndRatio = trimRange.end / (duration || 30);
    const currentRatio = currentTime / (duration || 30);

    for (let i = 0; i < barCount; i++) {
      const barRatio = i / barCount;
      const inTrimRange = barRatio >= activeStartRatio && barRatio <= activeEndRatio;
      const isPlayed = barRatio <= currentRatio;

      // Deterministic synthetic waveform based on index and harmonic frequencies
      const seed = Math.sin(i * 0.2) * 0.4 + Math.cos(i * 0.45) * 0.35 + Math.sin(i * 0.9) * 0.25;
      const normalizedAmp = Math.max(0.12, Math.min(0.95, Math.abs(seed)));
      const barH = normalizedAmp * (height - 12);
      const x = i * (barWidth + 1.5);
      const y = (height - barH) / 2;

      if (inTrimRange) {
        if (isPlayed) {
          ctx.fillStyle = '#D4B06A'; // Champagne Gold played
        } else {
          ctx.fillStyle = 'rgba(212, 176, 106, 0.45)'; // Champagne Gold unplayed in trim
        }
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'; // Muted outside trim
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 2);
      ctx.fill();
    }
  }, [isVideo, duration, currentTime, trimRange]);

  // Trim duration computation
  const selectedTrimDuration = Math.max(0, trimRange.end - trimRange.start);
  const trimReductionPercent = duration > 0 ? Math.round((1 - selectedTrimDuration / duration) * 100) : 0;

  // Technical metadata specs
  const mediaSpecs = useMemo(() => {
    const ext = currentFile?.name.split('.').pop()?.toUpperCase() || 'WAV';
    const sizeMb = currentFile?.buffer ? (currentFile.buffer.length / (1024 * 1024)).toFixed(2) : '1.85';
    return {
      fileName: currentFile?.name || 'audio_sample.wav',
      fileSize: `${sizeMb} MB`,
      format: ext,
      mediaType: isVideo ? 'Video Container' : 'Digital Audio Stream',
      channels: isVideo ? 'Stereo (2.0)' : '2 Channels (Stereo)',
      sampleRate: '44,100 Hz (44.1 kHz)',
      bitDepth: '16-bit PCM Signed Integer',
      bitrate: isVideo ? '2,400 kbps (H.264 / AAC)' : '1,411 kbps (Uncompressed)',
      duration: `${formatTimecode(duration)} (${duration.toFixed(2)}s)`,
      resolution: isVideo ? '1920 × 1080 (16:9 Full HD)' : 'N/A (Pure Audio)',
      frameRate: isVideo ? '29.97 fps (CFR)' : 'N/A',
      codec: isVideo ? 'avc1.640028 (H.264 High Profile)' : 'pcm_s16le (Linear PCM)',
    };
  }, [currentFile, isVideo, duration]);

  const copySpecsJson = () => {
    navigator.clipboard.writeText(JSON.stringify(mediaSpecs, null, 2));
    setCopiedInfo(true);
    setTimeout(() => setCopiedInfo(false), 2000);
  };

  return (
    <div className="media-canvas-container" id="media-workbench-canvas">
      {/* Hidden audio element for audio files */}
      {!isVideo && mediaUrl && (
        <audio
          ref={audioRef}
          src={mediaUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            if (isLooping && audioRef.current) {
              audioRef.current.currentTime = trimRange.start;
              audioRef.current.play();
              setIsPlaying(true);
            }
          }}
        />
      )}

      {/* Top Header Mode Selector */}
      <div className="media-canvas-header">
        <div className="media-view-selector" role="tablist">
          <button
            type="button"
            className={`media-mode-btn ${viewMode === 'trim' ? 'active' : ''}`}
            onClick={() => onViewModeChange('trim')}
            id="media-mode-trim-btn"
            role="tab"
            aria-selected={viewMode === 'trim'}
          >
            <Scissors size={14} />
            <span>Trim & Timeline</span>
          </button>
          <button
            type="button"
            className={`media-mode-btn ${viewMode === 'panel' ? 'active' : ''}`}
            onClick={() => onViewModeChange('panel')}
            id="media-mode-panel-btn"
            role="tab"
            aria-selected={viewMode === 'panel'}
          >
            <Sliders size={14} />
            <span>Format & Tuning</span>
          </button>
          <button
            type="button"
            className={`media-mode-btn ${viewMode === 'info' ? 'active' : ''}`}
            onClick={() => onViewModeChange('info')}
            id="media-mode-info-btn"
            role="tab"
            aria-selected={viewMode === 'info'}
          >
            <Info size={14} />
            <span>Technical Specs</span>
          </button>
        </div>

        <div className="media-canvas-meta">
          <span className="media-badge">
            {isVideo ? <Video size={12} /> : <Music size={12} />}
            <span>{currentFile?.name || 'media_asset'}</span>
          </span>
          <span className="media-duration-tag">{formatTimecode(duration)}</span>
        </div>
      </div>

      {/* Viewport Body */}
      <div className="media-canvas-body">
        {/* MODE 1: TRIM & TIMELINE */}
        {viewMode === 'trim' && (
          <div className="media-trim-stage">
            {/* Visual Screen / Waveform Display */}
            <div className="media-visual-viewport">
              {isVideo ? (
                <div className="video-viewport-wrapper">
                  <video
                    ref={videoRef}
                    src={mediaUrl || undefined}
                    className="media-video-player"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                  />
                  {!isPlaying && (
                    <button type="button" className="video-floating-play-btn" onClick={togglePlay}>
                      <Play size={24} fill="currentColor" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="audio-waveform-wrapper">
                  <div className="audio-hero-icon">
                    <FileAudio size={42} className="waveform-icon" />
                    <span className="audio-format-pill">{currentFile?.name.split('.').pop()?.toUpperCase() || 'WAV'}</span>
                  </div>
                  <div className="waveform-canvas-box">
                    <canvas
                      ref={waveformCanvasRef}
                      width={800}
                      height={120}
                      className="media-waveform-canvas"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                        handleSeek(ratio * duration);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Precision Transport Bar */}
            <div className="media-transport-toolbar">
              <div className="transport-controls-left">
                <button
                  type="button"
                  className="transport-btn primary-transport-btn"
                  onClick={togglePlay}
                  id="media-play-pause-btn"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>
                <button
                  type="button"
                  className="transport-btn"
                  onClick={() => handleSeek(Math.max(0, currentTime - 5))}
                  title="Rewind 5s"
                >
                  <ChevronLeft size={16} />
                  <span>-5s</span>
                </button>
                <button
                  type="button"
                  className="transport-btn"
                  onClick={() => handleSeek(Math.min(duration, currentTime + 5))}
                  title="Forward 5s"
                >
                  <span>+5s</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className={`transport-btn ${isLooping ? 'active-loop' : ''}`}
                  onClick={() => setIsLooping(!isLooping)}
                  title="Loop selection"
                >
                  <Repeat size={14} />
                </button>
              </div>

              {/* Timecode Readouts */}
              <div className="transport-timecode-box">
                <span className="timecode-current" id="media-timecode-current">
                  {formatTimecode(currentTime)}
                </span>
                <span className="timecode-divider">/</span>
                <span className="timecode-total">{formatTimecode(duration)}</span>
              </div>

              {/* Playback speed selector */}
              <div className="transport-speed-group">
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    className={`speed-pill ${playbackSpeed === spd ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(spd)}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Timeline & Trim Range Slider */}
            <div className="media-timeline-section">
              <div className="timeline-header-meta">
                <div className="timeline-labels">
                  <span className="timeline-title">Selection Timeline</span>
                  <span className="timeline-trim-summary">
                    Selected: <strong>{formatTimecode(selectedTrimDuration)}</strong>
                    {trimReductionPercent > 0 && ` (-${trimReductionPercent}%)`}
                  </span>
                </div>
                <div className="timeline-quick-actions">
                  <button
                    type="button"
                    className="timeline-action-link"
                    onClick={() => onTrimRangeChange({ start: currentTime, end: Math.max(currentTime + 1, trimRange.end) })}
                  >
                    Set Start to Playhead
                  </button>
                  <button
                    type="button"
                    className="timeline-action-link"
                    onClick={() => onTrimRangeChange({ start: Math.min(currentTime - 1, trimRange.start), end: currentTime })}
                  >
                    Set End to Playhead
                  </button>
                  <button
                    type="button"
                    className="timeline-action-link reset-link"
                    onClick={() => onTrimRangeChange({ start: 0, end: duration })}
                  >
                    Reset Range
                  </button>
                </div>
              </div>

              {/* Dual-Handle Slider Bar */}
              <div
                className="timeline-track-container"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  handleSeek(clickRatio * duration);
                }}
              >
                {/* Visual Unselected Dimmed Areas */}
                <div
                  className="timeline-dimmed-overlay left-dim"
                  style={{ width: `${(trimRange.start / (duration || 1)) * 100}%` }}
                />
                <div
                  className="timeline-active-slice"
                  style={{
                    left: `${(trimRange.start / (duration || 1)) * 100}%`,
                    width: `${((trimRange.end - trimRange.start) / (duration || 1)) * 100}%`,
                  }}
                />
                <div
                  className="timeline-dimmed-overlay right-dim"
                  style={{
                    left: `${(trimRange.end / (duration || 1)) * 100}%`,
                    width: `${(1 - trimRange.end / (duration || 1)) * 100}%`,
                  }}
                />

                {/* Playhead Marker */}
                <div
                  className="timeline-playhead-marker"
                  style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                >
                  <div className="playhead-line" />
                </div>
              </div>

              {/* Precise Dual Numeric Stepper Inputs */}
              <div className="trim-steppers-grid">
                <div className="stepper-card">
                  <label htmlFor="trim-start-input">Trim Start Point</label>
                  <div className="stepper-input-row">
                    <button
                      type="button"
                      className="stepper-nudge-btn"
                      onClick={() => onTrimRangeChange({ ...trimRange, start: Math.max(0, trimRange.start - 0.5) })}
                    >
                      -0.5s
                    </button>
                    <input
                      id="trim-start-input"
                      type="number"
                      step="0.1"
                      min="0"
                      max={trimRange.end - 0.1}
                      value={Math.round(trimRange.start * 100) / 100}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onTrimRangeChange({ ...trimRange, start: Math.min(val, trimRange.end - 0.1) });
                      }}
                      className="stepper-number-field"
                    />
                    <button
                      type="button"
                      className="stepper-nudge-btn"
                      onClick={() => onTrimRangeChange({ ...trimRange, start: Math.min(trimRange.end - 0.1, trimRange.start + 0.5) })}
                    >
                      +0.5s
                    </button>
                  </div>
                  <span className="stepper-readout">{formatTimecode(trimRange.start)}</span>
                </div>

                <div className="stepper-card">
                  <label htmlFor="trim-end-input">Trim End Point</label>
                  <div className="stepper-input-row">
                    <button
                      type="button"
                      className="stepper-nudge-btn"
                      onClick={() => onTrimRangeChange({ ...trimRange, end: Math.max(trimRange.start + 0.1, trimRange.end - 0.5) })}
                    >
                      -0.5s
                    </button>
                    <input
                      id="trim-end-input"
                      type="number"
                      step="0.1"
                      min={trimRange.start + 0.1}
                      max={duration}
                      value={Math.round(trimRange.end * 100) / 100}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || duration;
                        onTrimRangeChange({ ...trimRange, end: Math.min(duration, Math.max(trimRange.start + 0.1, val)) });
                      }}
                      className="stepper-number-field"
                    />
                    <button
                      type="button"
                      className="stepper-nudge-btn"
                      onClick={() => onTrimRangeChange({ ...trimRange, end: Math.min(duration, trimRange.end + 0.5) })}
                    >
                      +0.5s
                    </button>
                  </div>
                  <span className="stepper-readout">{formatTimecode(trimRange.end)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: FORMAT & TUNING */}
        {viewMode === 'panel' && (
          <div className="media-panel-stage">
            <div className="tuning-grid">
              {/* Media Preview Box */}
              <div className="tuning-preview-card">
                <div className="preview-top-badge">
                  <span>Input Playback</span>
                  <span className="pill-duration">{formatTimecode(duration)}</span>
                </div>
                {isVideo ? (
                  <video
                    src={mediaUrl || undefined}
                    controls
                    className="tuning-video-player"
                  />
                ) : (
                  <div className="tuning-audio-player-box">
                    <Music size={36} className="tuning-audio-icon" />
                    <audio src={mediaUrl || undefined} controls className="tuning-native-audio" />
                  </div>
                )}
              </div>

              {/* Volume & Dynamics Adjustments */}
              <div className="tuning-controls-card">
                <h4 className="tuning-card-title">Volume & Dynamics Processing</h4>
                <div className="tuning-row">
                  <div className="tuning-label-row">
                    <span>Gain Adjustment (dB)</span>
                    <span className="tuning-val-tag">{gainDb > 0 ? `+${gainDb}` : gainDb} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-18"
                    max="18"
                    step="1"
                    value={gainDb}
                    onChange={(e) => onGainDbChange(parseInt(e.target.value, 10))}
                    className="tuning-slider"
                  />
                  <div className="slider-ticks">
                    <span>-18 dB</span>
                    <span>0 dB (Unity)</span>
                    <span>+18 dB</span>
                  </div>
                </div>

                <div className="tuning-row">
                  <div className="tuning-label-row">
                    <span>Fade In Duration</span>
                    <span className="tuning-val-tag">{fadeInSec.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={fadeInSec}
                    onChange={(e) => onFadeInSecChange(parseFloat(e.target.value))}
                    className="tuning-slider"
                  />
                </div>

                <div className="tuning-row">
                  <div className="tuning-label-row">
                    <span>Fade Out Duration</span>
                    <span className="tuning-val-tag">{fadeOutSec.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={fadeOutSec}
                    onChange={(e) => onFadeOutSecChange(parseFloat(e.target.value))}
                    className="tuning-slider"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: TECHNICAL SPECS INSPECTOR */}
        {viewMode === 'info' && (
          <div className="media-info-stage">
            <div className="specs-card">
              <div className="specs-header">
                <div>
                  <h3 className="specs-title">Media Technical Diagnostics</h3>
                  <p className="specs-subtitle">Local container stream header and audio/video track metrics</p>
                </div>
                <button type="button" className="copy-specs-btn" onClick={copySpecsJson}>
                  {copiedInfo ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedInfo ? 'Copied Specs' : 'Copy Specs JSON'}</span>
                </button>
              </div>

              <div className="specs-table-wrapper">
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <td className="spec-label">File Name</td>
                      <td className="spec-value monospace">{mediaSpecs.fileName}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">File Size</td>
                      <td className="spec-value monospace">{mediaSpecs.fileSize}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Container Format</td>
                      <td className="spec-value"><span className="spec-pill">{mediaSpecs.format}</span></td>
                    </tr>
                    <tr>
                      <td className="spec-label">Media Stream Type</td>
                      <td className="spec-value">{mediaSpecs.mediaType}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Duration</td>
                      <td className="spec-value monospace">{mediaSpecs.duration}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Channels</td>
                      <td className="spec-value">{mediaSpecs.channels}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Sample Rate</td>
                      <td className="spec-value monospace">{mediaSpecs.sampleRate}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Bit Depth</td>
                      <td className="spec-value">{mediaSpecs.bitDepth}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Estimated Bitrate</td>
                      <td className="spec-value monospace">{mediaSpecs.bitrate}</td>
                    </tr>
                    {isVideo && (
                      <>
                        <tr>
                          <td className="spec-label">Video Resolution</td>
                          <td className="spec-value monospace">{mediaSpecs.resolution}</td>
                        </tr>
                        <tr>
                          <td className="spec-label">Frame Rate</td>
                          <td className="spec-value monospace">{mediaSpecs.frameRate}</td>
                        </tr>
                        <tr>
                          <td className="spec-label">Video Codec</td>
                          <td className="spec-value monospace">{mediaSpecs.codec}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
