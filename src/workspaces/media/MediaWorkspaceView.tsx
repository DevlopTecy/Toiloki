import React, { useState } from 'react';
import { MediaEngine } from '../../engines/media/media.engine';
import { FileDropzone, SelectedFile } from '../../components/file-system/FileDropzone';
import './MediaWorkspaceView.css';

interface MediaWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const MediaWorkspaceView: React.FC<MediaWorkspaceViewProps> = ({ utilityId }) => {
  return (
    <div className="media-workspace">
      {utilityId === 'audio-converter' && <AudioConverterView />}
      {utilityId === 'audio-trimmer' && <AudioTrimmerView />}
      {utilityId === 'audio-joiner' && <AudioJoinerView />}
      {utilityId === 'audio-volume-fade' && <AudioVolumeFadeView />}
      {utilityId === 'audio-metadata-editor' && <AudioMetadataView />}
      {utilityId === 'video-converter' && <VideoConverterView />}
      {utilityId === 'video-compressor' && <VideoCompressorView />}
      {utilityId === 'video-trimmer' && <VideoTrimmerView />}
      {utilityId === 'video-to-gif' && <VideoToGifView />}
      {utilityId === 'media-extract-audio' && <ExtractAudioView />}
      {utilityId === 'media-frame-extractor' && <FrameExtractorView />}
      {utilityId === 'media-subtitle-shift' && <SubtitleShiftView />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

function MediaCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="media-card">
      <h3 className="media-card-title">{title}</h3>
      {children}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="media-copy-btn" onClick={copy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── 1. Audio Converter ──────────────────────────────────────────────────────
function AudioConverterView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState('wav');

  return (
    <MediaCard title="Offline Audio Converter (WAV, MP3, OGG, AAC)">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac']}
        multiple={true}
        files={files}
        onFilesChanged={setFiles}
        label="Drop audio files to convert"
      />
      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Target Format:</label>
          <select className="control-select" value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}>
            <option value="wav">WAV (Lossless 16-bit PCM)</option>
            <option value="mp3">MP3 Audio</option>
            <option value="ogg">OGG Vorbis</option>
            <option value="m4a">M4A / AAC</option>
          </select>
        </div>
        {files.length > 0 && (
          <button className="tool-btn primary small-btn">
            Convert {files.length} File{files.length > 1 ? 's' : ''} to {targetFormat.toUpperCase()}
          </button>
        )}
      </div>
    </MediaCard>
  );
}

// ─── 2. Audio Trimmer ────────────────────────────────────────────────────────
function AudioTrimmerView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(30);

  return (
    <MediaCard title="Audio Trimmer & Waveform Cutter">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg', '.m4a']}
        multiple={false}
        files={files}
        onFilesChanged={setFiles}
        label="Select audio file to trim"
      />
      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Start Time (sec):</label>
          <input className="control-input" type="number" min={0} value={startSec} onChange={(e) => setStartSec(Number(e.target.value))} style={{ width: 100 }} />
        </div>
        <div className="control-group">
          <label className="control-label">End Time (sec):</label>
          <input className="control-input" type="number" min={0} value={endSec} onChange={(e) => setEndSec(Number(e.target.value))} style={{ width: 100 }} />
        </div>
        {files.length > 0 && (
          <button className="tool-btn primary small-btn">
            Trim Audio ({startSec}s - {endSec}s)
          </button>
        )}
      </div>
    </MediaCard>
  );
}

// ─── 3. Audio Joiner ─────────────────────────────────────────────────────────
function AudioJoinerView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);

  return (
    <MediaCard title="Audio Track Joiner & Merger">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg']}
        multiple={true}
        files={files}
        onFilesChanged={setFiles}
        label="Select audio tracks in order to merge"
      />
      {files.length >= 2 && (
        <div style={{ marginTop: 16 }}>
          <button className="tool-btn primary small-btn">
            Merge {files.length} Tracks into Single Audio
          </button>
        </div>
      )}
    </MediaCard>
  );
}

// ─── 4. Volume & Fade ────────────────────────────────────────────────────────
function AudioVolumeFadeView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [gain, setGain] = useState(0);
  const [fadeIn, setFadeIn] = useState(2);
  const [fadeOut, setFadeOut] = useState(3);

  return (
    <MediaCard title="Audio Volume Normalization & Fade Envelopes">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg']}
        multiple={false}
        files={files}
        onFilesChanged={setFiles}
        label="Select audio track"
      />
      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Gain Adjustment ({gain > 0 ? `+${gain}` : gain} dB):</label>
          <input type="range" min={-18} max={18} value={gain} onChange={(e) => setGain(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Fade-in (sec):</label>
          <input className="control-input" type="number" min={0} value={fadeIn} onChange={(e) => setFadeIn(Number(e.target.value))} style={{ width: 80 }} />
        </div>
        <div className="control-group">
          <label className="control-label">Fade-out (sec):</label>
          <input className="control-input" type="number" min={0} value={fadeOut} onChange={(e) => setFadeOut(Number(e.target.value))} style={{ width: 80 }} />
        </div>
      </div>
    </MediaCard>
  );
}

// ─── 5. Audio Metadata ───────────────────────────────────────────────────────
function AudioMetadataView() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');

  return (
    <MediaCard title="Audio ID3 Tag Inspector & Editor">
      <div className="control-group">
        <label className="control-label">Track Title:</label>
        <input className="control-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      </div>
      <div className="media-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Artist:</label>
          <input className="control-input" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Album:</label>
          <input className="control-input" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album" />
        </div>
      </div>
    </MediaCard>
  );
}

// ─── 6. Video Converter ──────────────────────────────────────────────────────
function VideoConverterView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  return (
    <MediaCard title="Local Video Converter (MP4, WebM, MKV)">
      <FileDropzone
        accept={['.mp4', '.webm', '.mkv', '.avi', '.mov']}
        multiple={false}
        files={files}
        onFilesChanged={setFiles}
        label="Select video file"
      />
    </MediaCard>
  );
}

// ─── 7. Video Compressor ─────────────────────────────────────────────────────
function VideoCompressorView() {
  const [targetMb, setTargetMb] = useState(25);
  return (
    <MediaCard title="Video File Size Compressor (Target MB / Discord / Email)">
      <div className="control-group">
        <label className="control-label">Target File Size Limit: {targetMb} MB</label>
        <input type="range" min={5} max={100} value={targetMb} onChange={(e) => setTargetMb(Number(e.target.value))} style={{ width: 280 }} />
      </div>
      <div className="media-notice-box" style={{ marginTop: 12 }}>
        Compresses video streams offline to fit under the {targetMb} MB boundary for sharing.
      </div>
    </MediaCard>
  );
}

// ─── 8. Video Trimmer ────────────────────────────────────────────────────────
function VideoTrimmerView() {
  return (
    <MediaCard title="Video Trimmer & Clip Slicer">
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        Slice start and end points without re-encoding using fast keyframe extraction.
      </p>
    </MediaCard>
  );
}

// ─── 9. Video to GIF ─────────────────────────────────────────────────────────
function VideoToGifView() {
  const [fps, setFps] = useState(15);
  const [width, setWidth] = useState(480);
  return (
    <MediaCard title="Video to Animated GIF Converter">
      <div className="media-controls-row">
        <div className="control-group">
          <label className="control-label">Framerate (FPS): {fps}</label>
          <input type="range" min={5} max={30} value={fps} onChange={(e) => setFps(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Width (px): {width}</label>
          <input type="range" min={240} max={720} step={20} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </div>
      </div>
    </MediaCard>
  );
}

// ─── 10. Extract Audio from Video ────────────────────────────────────────────
function ExtractAudioView() {
  return (
    <MediaCard title="Extract Audio Track from Video (MP4 → WAV/MP3)">
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        Demuxes audio streams from MP4, WebM, and MKV files locally into clean audio files.
      </p>
    </MediaCard>
  );
}

// ─── 11. Frame Extractor ─────────────────────────────────────────────────────
function FrameExtractorView() {
  return (
    <MediaCard title="Video Frame Sequence Extractor">
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        Extract high-resolution video frames at intervals (e.g. 1 frame/sec) as a PNG/JPEG ZIP archive.
      </p>
    </MediaCard>
  );
}

// ─── 12. Subtitle Shift & Convert ────────────────────────────────────────────
function SubtitleShiftView() {
  const [srt, setSrt] = useState(
    '1\n00:00:01,000 --> 00:00:04,000\nWelcome to Toiloki.\n\n2\n00:00:05,000 --> 00:00:08,000\nA local-first desktop utility suite.'
  );
  const [offsetMs, setOffsetMs] = useState(1500);

  const res = React.useMemo(() => {
    return MediaEngine.shiftSubtitles(srt, offsetMs).data;
  }, [srt, offsetMs]);

  return (
    <MediaCard title="Subtitle Shift & Timestamp Synchronizer">
      <div className="control-group">
        <label className="control-label">Time Offset (milliseconds - positive or negative):</label>
        <input className="control-input" type="number" step={100} value={offsetMs} onChange={(e) => setOffsetMs(Number(e.target.value))} style={{ width: 140 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
        <div>
          <label className="control-label">Original Subtitles (SRT):</label>
          <textarea className="code-editor" rows={6} value={srt} onChange={(e) => setSrt(e.target.value)} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label className="control-label">Shifted Subtitles:</label>
            {res && <CopyBtn text={res.shiftedSrt} />}
          </div>
          <textarea className="code-editor" rows={6} readOnly value={res?.shiftedSrt || ''} />
        </div>
      </div>
    </MediaCard>
  );
}
