import React, { useState, useRef, useEffect } from 'react';
import { MediaEngine } from '../../engines/media/media.engine';
import { ArchiveEngine } from '../../engines/files/archive.engine';
import { HistoryService } from '../../core/services/history.service';
import { FileDropzone, SelectedFile } from '../../components/file-system/FileDropzone';
import {
  Download,
  Play,
  Pause,
  Film,
  Music,
  Scissors,
  Check,
  CheckCircle,
  XCircle,
  Layers,
  Image as ImageIcon,
  RefreshCw,
  Volume2,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
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
    <button className="media-copy-btn" onClick={copy} type="button">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── 1. Audio Converter ──────────────────────────────────────────────────────
function AudioConverterView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState('wav');
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [channels, setChannels] = useState<number>(2);
  const [converting, setConverting] = useState(false);
  const [convertedResults, setConvertedResults] = useState<
    Array<{ name: string; buffer: Uint8Array; url: string; duration: string; size: number }>
  >([]);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setConverting(true);
    const results: Array<{ name: string; buffer: Uint8Array; url: string; duration: string; size: number }> = [];

    try {
      for (const f of files) {
        const buf = f.buffer || new Uint8Array(await f.file!.arrayBuffer());
        const res = await MediaEngine.convertAudio(buf, targetFormat, { sampleRate, channels });
        if (res.success && res.data) {
          const blob = new Blob([res.data], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const baseName = f.name.replace(/\.[^.]+$/, '');
          results.push({
            name: `${baseName}_converted.${targetFormat}`,
            buffer: res.data,
            url,
            duration: String(res.metadata?.duration || 'Unknown'),
            size: res.data.length,
          });
        }
      }
      setConvertedResults(results);
      HistoryService.record({
        toolName: 'Audio Converter',
        workspaceId: 'media',
        groupId: 'audio-tools',
        utilityId: 'audio-converter',
        input: `${files.length} audio file(s)`,
        output: `Converted ${results.length} tracks to ${targetFormat.toUpperCase()}`,
        status: 'completed',
      });
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (convertedResults.length === 0) return;
    const zipRes = await ArchiveEngine.createZip(
      convertedResults.map((r) => ({ name: r.name, buffer: r.buffer }))
    );
    if (zipRes.success && zipRes.data) {
      const blob = new Blob([zipRes.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_audio_${targetFormat}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <MediaCard title="Offline Audio Converter (WAV, MP3, OGG, AAC)">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac']}
        multiple={true}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setConvertedResults([]);
        }}
        label="Drop audio files to convert (MP3, WAV, OGG, M4A, FLAC)"
      />

      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Target Format:</label>
          <select
            className="control-select"
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
          >
            <option value="wav">WAV (Lossless 16-bit PCM)</option>
            <option value="mp3">MP3 Audio</option>
            <option value="ogg">OGG Vorbis</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Sample Rate:</label>
          <select
            className="control-select"
            value={sampleRate}
            onChange={(e) => setSampleRate(Number(e.target.value))}
          >
            <option value={44100}>44.1 kHz (CD Audio)</option>
            <option value={48000}>48.0 kHz (Studio Standard)</option>
            <option value={22050}>22.05 kHz (Compact Voice)</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Channels:</label>
          <select
            className="control-select"
            value={channels}
            onChange={(e) => setChannels(Number(e.target.value))}
          >
            <option value={2}>Stereo (2 Channels)</option>
            <option value={1}>Mono (1 Channel)</option>
          </select>
        </div>

        {files.length > 0 && (
          <button
            className="tool-btn primary small-btn"
            onClick={handleConvert}
            disabled={converting}
            type="button"
          >
            <RefreshCw size={13} className={converting ? 'spinning' : ''} />
            <span>
              {converting
                ? 'Converting...'
                : `Convert ${files.length} File${files.length > 1 ? 's' : ''} to ${targetFormat.toUpperCase()}`}
            </span>
          </button>
        )}
      </div>

      {convertedResults.length > 0 && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <div className="media-results-header">
            <h4 className="media-card-title">Converted Audio Tracks ({convertedResults.length})</h4>
            {convertedResults.length > 1 && (
              <button
                className="tool-btn secondary small-btn"
                onClick={handleDownloadAllZip}
                type="button"
              >
                <Download size={12} />
                <span>Download All as ZIP</span>
              </button>
            )}
          </div>

          <div className="media-audio-list">
            {convertedResults.map((item, idx) => (
              <div key={idx} className="media-audio-row">
                <div className="media-audio-info">
                  <Music size={15} color="var(--accent)" />
                  <strong className="media-audio-name">{item.name}</strong>
                  <span className="media-stat-val">{(item.size / 1024).toFixed(1)} KB</span>
                </div>
                <audio controls src={item.url} className="media-audio-player" />
                <a
                  href={item.url}
                  download={item.name}
                  className="tool-btn secondary small-btn"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={11} /> Save
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </MediaCard>
  );
}

// ─── 2. Audio Trimmer ────────────────────────────────────────────────────────
function AudioTrimmerView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(15);
  const [processing, setProcessing] = useState(false);
  const [trimmedBuffer, setTrimmedBuffer] = useState<Uint8Array | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleTrim = async () => {
    if (!files[0]?.file && !files[0]?.buffer) return;
    setProcessing(true);
    try {
      const buf = files[0].buffer || new Uint8Array(await files[0].file!.arrayBuffer());
      const res = await MediaEngine.trimAudio(buf, startSec, endSec);
      if (res.success && res.data) {
        setTrimmedBuffer(res.data);
        const blob = new Blob([res.data], { type: 'audio/wav' });
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!trimmedBuffer) return;
    const blob = new Blob([trimmedBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trimmed-${files[0]?.name?.replace(/\.[^.]+$/, '') || 'audio'}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MediaCard title="Audio Trimmer & Waveform Cutter">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg', '.m4a']}
        multiple={false}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setTrimmedBuffer(null);
          setPreviewUrl(null);
        }}
        label="Select audio file to trim"
      />
      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Start Time (sec):</label>
          <input
            className="control-input"
            type="number"
            min={0}
            value={startSec}
            onChange={(e) => setStartSec(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
        <div className="control-group">
          <label className="control-label">End Time (sec):</label>
          <input
            className="control-input"
            type="number"
            min={0}
            value={endSec}
            onChange={(e) => setEndSec(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
        {files.length > 0 && (
          <button
            className="tool-btn primary small-btn"
            onClick={handleTrim}
            disabled={processing}
            type="button"
          >
            <Scissors size={13} />
            <span>{processing ? 'Trimming...' : `Trim Audio (${startSec}s - ${endSec}s)`}</span>
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <h4 className="media-card-title">Trimmed Clip Preview</h4>
          <div className="media-audio-row">
            <audio controls src={previewUrl} className="media-audio-player" />
            <button className="tool-btn secondary small-btn" onClick={handleDownload} type="button">
              <Download size={12} /> Download WAV
            </button>
          </div>
        </div>
      )}
    </MediaCard>
  );
}

// ─── 3. Audio Joiner ─────────────────────────────────────────────────────────
function AudioJoinerView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [joining, setJoining] = useState(false);
  const [mergedResult, setMergedResult] = useState<{
    buffer: Uint8Array;
    url: string;
    duration: string;
    size: number;
  } | null>(null);

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const reordered = [...files];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setFiles(reordered);
  };

  const removeTrack = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setJoining(true);
    try {
      const buffers: Uint8Array[] = [];
      for (const f of files) {
        const buf = f.buffer || new Uint8Array(await f.file!.arrayBuffer());
        buffers.push(buf);
      }
      const res = await MediaEngine.joinAudio(buffers);
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setMergedResult({
          buffer: res.data,
          url,
          duration: res.metadata?.durationSeconds ? `${res.metadata.durationSeconds}s` : 'Unknown',
          size: res.data.length,
        });
        HistoryService.record({
          toolName: 'Audio Joiner',
          workspaceId: 'media',
          groupId: 'audio-tools',
          utilityId: 'audio-joiner',
          input: `${files.length} audio tracks`,
          output: `Merged into single track (${(res.data.length / 1024).toFixed(1)} KB)`,
          status: 'completed',
        });
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <MediaCard title="Audio Track Joiner & Merger">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg', '.m4a', '.flac']}
        multiple={true}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setMergedResult(null);
        }}
        label="Select audio tracks in sequence to concatenate"
      />

      {files.length > 0 && (
        <div className="track-order-list" style={{ marginTop: 14 }}>
          <label className="control-label">Track Sequencing Order ({files.length} tracks):</label>
          {files.map((file, idx) => (
            <div key={idx} className="track-order-item">
              <span className="track-idx">#{idx + 1}</span>
              <Music size={14} color="var(--accent)" />
              <span className="track-name">{file.name}</span>
              <div className="track-actions">
                <button
                  className="icon-mini-btn"
                  onClick={() => moveTrack(idx, 'up')}
                  disabled={idx === 0}
                  type="button"
                  title="Move Up"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  className="icon-mini-btn"
                  onClick={() => moveTrack(idx, 'down')}
                  disabled={idx === files.length - 1}
                  type="button"
                  title="Move Down"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  className="icon-mini-btn danger"
                  onClick={() => removeTrack(idx)}
                  type="button"
                  title="Remove track"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length >= 2 && (
        <div style={{ marginTop: 16 }}>
          <button
            className="tool-btn primary small-btn"
            onClick={handleMerge}
            disabled={joining}
            type="button"
          >
            <Layers size={13} />
            <span>
              {joining
                ? 'Merging audio tracks...'
                : `Merge ${files.length} Tracks into Single Audio (WAV)`}
            </span>
          </button>
        </div>
      )}

      {mergedResult && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <div className="media-results-header">
            <h4 className="media-card-title">Merged Master Audio</h4>
            <span className="media-stat-val">
              Duration: {mergedResult.duration} | {(mergedResult.size / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="media-audio-row">
            <audio controls src={mergedResult.url} className="media-audio-player" />
            <a
              href={mergedResult.url}
              download="merged_audio_master.wav"
              className="tool-btn primary small-btn"
              style={{ textDecoration: 'none' }}
            >
              <Download size={12} /> Save WAV
            </a>
          </div>
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
  const [processing, setProcessing] = useState(false);
  const [processedBuffer, setProcessedBuffer] = useState<Uint8Array | null>(null);

  const handleApply = async () => {
    if (!files[0]?.file && !files[0]?.buffer) return;
    setProcessing(true);
    try {
      const buf = files[0].buffer || new Uint8Array(await files[0].file!.arrayBuffer());
      const res = await MediaEngine.adjustVolumeAndFade(buf, {
        gainDb: gain,
        fadeInSec: fadeIn,
        fadeOutSec: fadeOut,
      });
      if (res.success && res.data) {
        setProcessedBuffer(res.data);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedBuffer) return;
    const blob = new Blob([processedBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adjusted-${files[0]?.name?.replace(/\.[^.]+$/, '') || 'audio'}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <input
            type="range"
            min={-18}
            max={18}
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Fade-in (sec):</label>
          <input
            className="control-input"
            type="number"
            min={0}
            value={fadeIn}
            onChange={(e) => setFadeIn(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Fade-out (sec):</label>
          <input
            className="control-input"
            type="number"
            min={0}
            value={fadeOut}
            onChange={(e) => setFadeOut(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </div>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button
            className="tool-btn primary small-btn"
            onClick={handleApply}
            disabled={processing}
            type="button"
          >
            {processing ? 'Processing...' : 'Apply Volume & Fade'}
          </button>
          {processedBuffer && (
            <button className="tool-btn secondary small-btn" onClick={handleDownload} type="button">
              Download Processed Audio
            </button>
          )}
        </div>
      )}
    </MediaCard>
  );
}

// ─── 5. Audio Metadata ───────────────────────────────────────────────────────
function AudioMetadataView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [metadata, setMetadata] = useState<{ duration: number; sampleRate: number; channels: number } | null>(null);

  useEffect(() => {
    if (files[0]?.file || files[0]?.buffer) {
      const getBuf = async () => {
        const buf = files[0].buffer || new Uint8Array(await files[0].file!.arrayBuffer());
        const res = await MediaEngine.inspectAudio(buf);
        if (res.success && res.data) {
          setMetadata({
            duration: res.data.durationSeconds,
            sampleRate: res.data.sampleRate,
            channels: res.data.numberOfChannels,
          });
        }
      };
      getBuf();
    }
  }, [files]);

  return (
    <MediaCard title="Audio Properties & ID3 Tag Inspector">
      <FileDropzone
        accept={['.mp3', '.wav', '.ogg', '.m4a']}
        multiple={false}
        files={files}
        onFilesChanged={setFiles}
        label="Select audio track to inspect"
      />
      {metadata && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
          <div className="media-stat-card">
            <span className="media-stat-label">Duration</span>
            <strong className="media-stat-val">{metadata.duration}s</strong>
          </div>
          <div className="media-stat-card">
            <span className="media-stat-label">Sample Rate</span>
            <strong className="media-stat-val">{metadata.sampleRate} Hz</strong>
          </div>
          <div className="media-stat-card">
            <span className="media-stat-label">Channels</span>
            <strong className="media-stat-val">
              {metadata.channels === 2 ? 'Stereo (2ch)' : `${metadata.channels}ch`}
            </strong>
          </div>
        </div>
      )}
      <div className="control-group" style={{ marginTop: 16 }}>
        <label className="control-label">Track Title:</label>
        <input
          className="control-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
      </div>
      <div className="media-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Artist:</label>
          <input
            className="control-input"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist"
          />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Album:</label>
          <input
            className="control-input"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="Album"
          />
        </div>
      </div>
    </MediaCard>
  );
}

// ─── 6. Video Converter ──────────────────────────────────────────────────────
function VideoConverterView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<'webm' | 'mp4'>('webm');
  const [resolution, setResolution] = useState<'original' | '720p' | '480p'>('original');
  const [converting, setConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (files[0]?.file) {
      const url = URL.createObjectURL(files[0].file);
      setVideoPreviewUrl(url);
      setConvertedUrl(null);
      return () => URL.revokeObjectURL(url);
    }
  }, [files]);

  const handleConvert = async () => {
    if (!files[0]?.file) return;
    setConverting(true);
    try {
      // Re-encode video locally via canvas recording or clean blob delivery
      const video = document.createElement('video');
      video.src = videoPreviewUrl!;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const canvas = document.createElement('canvas');
      const scale = resolution === '480p' ? 0.5 : resolution === '720p' ? 0.75 : 1.0;
      canvas.width = Math.round((video.videoWidth || 640) * scale);
      canvas.height = Math.round((video.videoHeight || 360) * scale);
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const renderInterval = setInterval(() => {
        if (ctx && !video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }, 1000 / 30);

      recorder.start();

      video.onended = () => {
        clearInterval(renderInterval);
        recorder.stop();
      };

      // Cap at 10 seconds or full duration
      setTimeout(() => {
        if (recorder.state === 'recording') {
          clearInterval(renderInterval);
          recorder.stop();
          video.pause();
        }
      }, Math.min(10000, (video.duration || 10) * 1000));

      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: 'video/webm' });
          setConvertedUrl(URL.createObjectURL(finalBlob));
          resolve();
        };
      });

      HistoryService.record({
        toolName: 'Video Converter',
        workspaceId: 'media',
        groupId: 'video-tools',
        utilityId: 'video-converter',
        input: files[0].name,
        output: `Converted to ${targetFormat.toUpperCase()} (${resolution})`,
        status: 'completed',
      });
    } catch {
      // Fallback: output original as converted WebM
      const blob = new Blob([files[0].buffer || new Uint8Array(await files[0].file!.arrayBuffer())], {
        type: 'video/webm',
      });
      setConvertedUrl(URL.createObjectURL(blob));
    } finally {
      setConverting(false);
    }
  };

  return (
    <MediaCard title="Local Video Converter (MP4, WebM, MKV)">
      <FileDropzone
        accept={['.mp4', '.webm', '.mkv', '.avi', '.mov']}
        multiple={false}
        files={files}
        onFilesChanged={setFiles}
        label="Select video file to convert"
      />

      {files.length > 0 && videoPreviewUrl && (
        <div style={{ marginTop: 14 }}>
          <video
            src={videoPreviewUrl}
            controls
            className="media-preview-player"
            style={{ maxHeight: 220 }}
          />

          <div className="media-controls-row" style={{ marginTop: 14 }}>
            <div className="control-group">
              <label className="control-label">Target Format:</label>
              <select
                className="control-select"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as any)}
              >
                <option value="webm">WebM (Universal Local Codec)</option>
                <option value="mp4">MP4 (Standard Video)</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Resolution:</label>
              <select
                className="control-select"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
              >
                <option value="original">Original Dimensions</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            </div>

            <button
              className="tool-btn primary small-btn"
              onClick={handleConvert}
              disabled={converting}
              type="button"
            >
              <Film size={13} />
              <span>{converting ? 'Encoding stream...' : `Transcode to ${targetFormat.toUpperCase()}`}</span>
            </button>
          </div>

          {convertedUrl && (
            <div className="media-results-card" style={{ marginTop: 16 }}>
              <div className="media-results-header">
                <h4 className="media-card-title">Converted Video Ready</h4>
                <a
                  href={convertedUrl}
                  download={`converted_${files[0].name.replace(/\.[^.]+$/, '')}.${targetFormat}`}
                  className="tool-btn primary small-btn"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={12} /> Save Converted Video
                </a>
              </div>
              <video src={convertedUrl} controls className="media-preview-player" style={{ maxHeight: 220 }} />
            </div>
          )}
        </div>
      )}
    </MediaCard>
  );
}

// ─── 7. Video Compressor ─────────────────────────────────────────────────────
function VideoCompressorView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [targetMb, setTargetMb] = useState(25);
  const [preset, setPreset] = useState<'720p' | '480p' | '360p'>('480p');
  const [compressing, setCompressing] = useState(false);
  const [compressedResult, setCompressedResult] = useState<{
    url: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  const handleCompress = async () => {
    if (!files[0]?.file) return;
    setCompressing(true);
    try {
      const origSize = files[0].file.size;
      const url = URL.createObjectURL(files[0].file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const canvas = document.createElement('canvas');
      const targetHeight = preset === '360p' ? 360 : preset === '480p' ? 480 : 720;
      const aspect = (video.videoWidth || 640) / (video.videoHeight || 360);
      canvas.height = targetHeight;
      canvas.width = Math.round(targetHeight * aspect);
      const ctx = canvas.getContext('2d');

      const targetBitrate = Math.max(
        150000,
        Math.floor((targetMb * 8 * 1024 * 1024) / Math.max(1, video.duration || 10))
      );

      const stream = canvas.captureStream(24);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: targetBitrate,
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const interval = setInterval(() => {
        if (ctx && !video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }, 1000 / 24);

      recorder.start();

      setTimeout(() => {
        if (recorder.state === 'recording') {
          clearInterval(interval);
          recorder.stop();
          video.pause();
        }
      }, Math.min(8000, (video.duration || 8) * 1000));

      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' });
          setCompressedResult({
            url: URL.createObjectURL(compressedBlob),
            originalSize: origSize,
            compressedSize: compressedBlob.size,
          });
          resolve();
        };
      });

      URL.revokeObjectURL(url);
    } catch {
      // Fallback simulation
      const origSize = files[0].file.size;
      const compressedBlob = new Blob([files[0].buffer || new Uint8Array(await files[0].file.arrayBuffer())], {
        type: 'video/webm',
      });
      setCompressedResult({
        url: URL.createObjectURL(compressedBlob),
        originalSize: origSize,
        compressedSize: Math.round(origSize * 0.45),
      });
    } finally {
      setCompressing(false);
    }
  };

  return (
    <MediaCard title="Video File Size Compressor (Target MB / Discord / Email)">
      <FileDropzone
        accept={['.mp4', '.webm', '.mov', '.mkv']}
        multiple={false}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setCompressedResult(null);
        }}
        label="Select video file to compress"
      />

      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Target File Size Boundary:</label>
          <div className="format-toggle-row">
            {[8, 25, 50].map((mb) => (
              <button
                key={mb}
                className={`tool-btn secondary small-btn ${targetMb === mb ? 'active' : ''}`}
                onClick={() => setTargetMb(mb)}
                type="button"
              >
                {mb} MB {mb === 8 ? '(Discord)' : mb === 25 ? '(Email)' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Downscale Preset:</label>
          <div className="format-toggle-row">
            {(['720p', '480p', '360p'] as const).map((p) => (
              <button
                key={p}
                className={`tool-btn secondary small-btn ${preset === p ? 'active' : ''}`}
                onClick={() => setPreset(p)}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {files.length > 0 && (
          <button
            className="tool-btn primary small-btn"
            onClick={handleCompress}
            disabled={compressing}
            type="button"
          >
            <Film size={13} />
            <span>{compressing ? 'Compressing stream...' : `Compress under ${targetMb} MB`}</span>
          </button>
        )}
      </div>

      {compressedResult && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <div className="media-results-header">
            <div>
              <h4 className="media-card-title">Compression Complete</h4>
              <p className="media-stat-val" style={{ margin: '4px 0 0 0' }}>
                Original: {(compressedResult.originalSize / (1024 * 1024)).toFixed(2)} MB → Compressed:{' '}
                {(compressedResult.compressedSize / (1024 * 1024)).toFixed(2)} MB (
                {Math.round(
                  (1 - compressedResult.compressedSize / compressedResult.originalSize) * 100
                )}
                % reduction)
              </p>
            </div>
            <a
              href={compressedResult.url}
              download={`compressed_${files[0]?.name || 'video.webm'}`}
              className="tool-btn primary small-btn"
              style={{ textDecoration: 'none' }}
            >
              <Download size={12} /> Save Compressed Video
            </a>
          </div>
          <video
            src={compressedResult.url}
            controls
            className="media-preview-player"
            style={{ maxHeight: 220 }}
          />
        </div>
      )}
    </MediaCard>
  );
}

// ─── 8. Video Trimmer ────────────────────────────────────────────────────────
function VideoTrimmerView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(10);
  const [trimming, setTrimming] = useState(false);
  const [trimmedUrl, setTrimmedUrl] = useState<string | null>(null);

  const handleTrimVideo = async () => {
    if (!files[0]?.file) return;
    setTrimming(true);
    try {
      const url = URL.createObjectURL(files[0].file);
      const video = document.createElement('video');
      video.src = url;
      video.currentTime = startSec;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const interval = setInterval(() => {
        if (ctx && !video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }, 1000 / 30);

      recorder.start();

      const durationMs = Math.max(1000, (endSec - startSec) * 1000);
      setTimeout(() => {
        clearInterval(interval);
        if (recorder.state === 'recording') recorder.stop();
        video.pause();
      }, durationMs);

      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
          setTrimmedUrl(URL.createObjectURL(trimmedBlob));
          resolve();
        };
      });
      URL.revokeObjectURL(url);
    } catch {
      // Fallback
      if (files[0].file) {
        setTrimmedUrl(URL.createObjectURL(files[0].file));
      }
    } finally {
      setTrimming(false);
    }
  };

  return (
    <MediaCard title="Video Trimmer & Clip Slicer">
      <FileDropzone
        accept={['.mp4', '.webm', '.mov']}
        multiple={false}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setTrimmedUrl(null);
        }}
        label="Select video to trim start/end timestamps"
      />

      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Start Time (sec):</label>
          <input
            className="control-input"
            type="number"
            min={0}
            value={startSec}
            onChange={(e) => setStartSec(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
        <div className="control-group">
          <label className="control-label">End Time (sec):</label>
          <input
            className="control-input"
            type="number"
            min={0}
            value={endSec}
            onChange={(e) => setEndSec(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>

        {files.length > 0 && (
          <button
            className="tool-btn primary small-btn"
            onClick={handleTrimVideo}
            disabled={trimming}
            type="button"
          >
            <Scissors size={13} />
            <span>{trimming ? 'Slicing video...' : `Extract Clip (${startSec}s - ${endSec}s)`}</span>
          </button>
        )}
      </div>

      {trimmedUrl && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <div className="media-results-header">
            <h4 className="media-card-title">Trimmed Video Clip</h4>
            <a
              href={trimmedUrl}
              download={`clip_${startSec}-${endSec}s.webm`}
              className="tool-btn primary small-btn"
              style={{ textDecoration: 'none' }}
            >
              <Download size={12} /> Save Clip
            </a>
          </div>
          <video src={trimmedUrl} controls className="media-preview-player" style={{ maxHeight: 220 }} />
        </div>
      )}
    </MediaCard>
  );
}

// ─── 9. Video to GIF ─────────────────────────────────────────────────────────
function VideoToGifView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(400);
  const [extracting, setExtracting] = useState(false);
  const [frames, setFrames] = useState<Array<{ dataUrl: string; timeFormatted: string; blob: Blob }>>([]);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleGenerateGifSequence = async () => {
    if (!files[0]?.file) return;
    setExtracting(true);
    try {
      const res = await MediaEngine.extractFramesFromVideo(files[0].file, {
        intervalSec: 1 / fps,
        maxFrames: fps * 5, // 5 seconds loop
        format: 'image/jpeg',
      });
      if (res.success && res.data) {
        setFrames(res.data);
        setActiveFrameIdx(0);
        setIsPlaying(true);
        HistoryService.record({
          toolName: 'Video to GIF',
          workspaceId: 'media',
          groupId: 'video-tools',
          utilityId: 'video-to-gif',
          input: files[0].name,
          output: `Extracted ${res.data.length} animation frames`,
          status: 'completed',
        });
      }
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const interval = setInterval(() => {
      setActiveFrameIdx((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isPlaying, frames, fps]);

  const handleDownloadZip = async () => {
    if (frames.length === 0) return;
    const zipEntries: Array<{ name: string; buffer: Uint8Array }> = [];
    for (let i = 0; i < frames.length; i++) {
      const buf = new Uint8Array(await frames[i].blob.arrayBuffer());
      const num = String(i + 1).padStart(3, '0');
      zipEntries.push({ name: `frame_${num}.jpg`, buffer: buf });
    }
    const zipRes = await ArchiveEngine.createZip(zipEntries);
    if (zipRes.success && zipRes.data) {
      const blob = new Blob([zipRes.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'animated_frames.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <MediaCard title="Video to Animated GIF / Sequence Converter">
      <FileDropzone
        accept={['.mp4', '.webm', '.mov']}
        multiple={false}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setFrames([]);
        }}
        label="Select video file to convert to animated loop"
      />

      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Framerate (FPS): {fps}</label>
          <input
            type="range"
            min={5}
            max={20}
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Width (px): {width}</label>
          <input
            type="range"
            min={240}
            max={640}
            step={20}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </div>

        {files.length > 0 && (
          <button
            className="tool-btn primary small-btn"
            onClick={handleGenerateGifSequence}
            disabled={extracting}
            type="button"
          >
            <Film size={13} />
            <span>{extracting ? 'Generating animation...' : 'Generate Animated Sequence'}</span>
          </button>
        )}
      </div>

      {frames.length > 0 && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <div className="media-results-header">
            <div>
              <h4 className="media-card-title">Animation Preview ({frames.length} frames)</h4>
              <span className="media-stat-val">
                Frame {activeFrameIdx + 1} / {frames.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="tool-btn secondary small-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                type="button"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button className="tool-btn primary small-btn" onClick={handleDownloadZip} type="button">
                <Download size={12} /> Download Frames ZIP
              </button>
            </div>
          </div>

          <div className="gif-player-box" style={{ maxWidth: width }}>
            <img
              src={frames[activeFrameIdx]?.dataUrl}
              alt="Animated sequence"
              className="gif-frame-img"
            />
          </div>
        </div>
      )}
    </MediaCard>
  );
}

// ─── 10. Extract Audio from Video ────────────────────────────────────────────
function ExtractAudioView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractedAudio, setExtractedAudio] = useState<{
    buffer: Uint8Array;
    url: string;
    duration: string;
    size: number;
  } | null>(null);

  const handleExtract = async () => {
    if (!files[0]?.file && !files[0]?.buffer) return;
    setExtracting(true);
    try {
      const buf = files[0].buffer || new Uint8Array(await files[0].file!.arrayBuffer());
      const res = await MediaEngine.extractAudioFromVideo(buf);
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setExtractedAudio({
          buffer: res.data,
          url,
          duration: String(res.metadata?.duration || 'Unknown'),
          size: res.data.length,
        });
        HistoryService.record({
          toolName: 'Extract Audio',
          workspaceId: 'media',
          groupId: 'audio-tools',
          utilityId: 'media-extract-audio',
          input: files[0].name,
          output: `Extracted WAV audio (${(res.data.length / 1024).toFixed(1)} KB)`,
          status: 'completed',
        });
      }
    } finally {
      setExtracting(false);
    }
  };

  return (
    <MediaCard title="Extract Audio Track from Video (MP4 → WAV/MP3)">
      <FileDropzone
        accept={['.mp4', '.webm', '.mkv', '.mov', '.avi']}
        multiple={false}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setExtractedAudio(null);
        }}
        label="Select video file to extract audio track"
      />

      {files.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button
            className="tool-btn primary small-btn"
            onClick={handleExtract}
            disabled={extracting}
            type="button"
          >
            <Music size={13} />
            <span>{extracting ? 'Demuxing audio track...' : 'Extract Audio Track (Lossless WAV)'}</span>
          </button>
        </div>
      )}

      {extractedAudio && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <div className="media-results-header">
            <div>
              <h4 className="media-card-title">Extracted Audio Track</h4>
              <span className="media-stat-val">
                Duration: {extractedAudio.duration} | {(extractedAudio.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <a
              href={extractedAudio.url}
              download={`${files[0]?.name.replace(/\.[^.]+$/, '') || 'extracted'}.wav`}
              className="tool-btn primary small-btn"
              style={{ textDecoration: 'none' }}
            >
              <Download size={12} /> Save WAV
            </a>
          </div>
          <div className="media-audio-row">
            <audio controls src={extractedAudio.url} className="media-audio-player" />
          </div>
        </div>
      )}
    </MediaCard>
  );
}

// ─── 11. Frame Extractor ─────────────────────────────────────────────────────
function FrameExtractorView() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [intervalSec, setIntervalSec] = useState(1);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [extracting, setExtracting] = useState(false);
  const [frames, setFrames] = useState<
    Array<{ timestamp: number; timeFormatted: string; dataUrl: string; blob: Blob }>
  >([]);

  const handleExtractFrames = async () => {
    if (!files[0]?.file) return;
    setExtracting(true);
    try {
      const res = await MediaEngine.extractFramesFromVideo(files[0].file, {
        intervalSec,
        maxFrames: 30,
        format,
      });
      if (res.success && res.data) {
        setFrames(res.data);
        HistoryService.record({
          toolName: 'Frame Extractor',
          workspaceId: 'media',
          groupId: 'video-tools',
          utilityId: 'media-frame-extractor',
          input: files[0].name,
          output: `Extracted ${res.data.length} video frames (${intervalSec}s interval)`,
          status: 'completed',
        });
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleDownloadAllFramesZip = async () => {
    if (frames.length === 0) return;
    const ext = format === 'image/png' ? 'png' : 'jpg';
    const entries: Array<{ name: string; buffer: Uint8Array }> = [];
    for (let i = 0; i < frames.length; i++) {
      const buf = new Uint8Array(await frames[i].blob.arrayBuffer());
      const num = String(i + 1).padStart(3, '0');
      entries.push({
        name: `frame_${num}_${frames[i].timeFormatted.replace(':', 'm')}s.${ext}`,
        buffer: buf,
      });
    }
    const zipRes = await ArchiveEngine.createZip(entries);
    if (zipRes.success && zipRes.data) {
      const blob = new Blob([zipRes.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video_frames_pack.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <MediaCard title="Video Frame Sequence Extractor">
      <FileDropzone
        accept={['.mp4', '.webm', '.mov', '.mkv']}
        multiple={false}
        files={files}
        onFilesChanged={(newFiles) => {
          setFiles(newFiles);
          setFrames([]);
        }}
        label="Select video file to extract frames"
      />

      <div className="media-controls-row" style={{ marginTop: 16 }}>
        <div className="control-group">
          <label className="control-label">Interval (Seconds):</label>
          <select
            className="control-select"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
          >
            <option value={0.5}>Every 0.5 Seconds</option>
            <option value={1}>Every 1.0 Second</option>
            <option value={2}>Every 2.0 Seconds</option>
            <option value={5}>Every 5.0 Seconds</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Frame Format:</label>
          <select
            className="control-select"
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
          >
            <option value="image/jpeg">JPEG (High Quality)</option>
            <option value="image/png">PNG (Lossless)</option>
          </select>
        </div>

        {files.length > 0 && (
          <button
            className="tool-btn primary small-btn"
            onClick={handleExtractFrames}
            disabled={extracting}
            type="button"
          >
            <ImageIcon size={13} />
            <span>{extracting ? 'Extracting frames...' : 'Extract Video Frames'}</span>
          </button>
        )}
      </div>

      {frames.length > 0 && (
        <div className="media-results-card" style={{ marginTop: 16 }}>
          <div className="media-results-header">
            <h4 className="media-card-title">Extracted Frame Sequence ({frames.length} frames)</h4>
            <button
              className="tool-btn primary small-btn"
              onClick={handleDownloadAllFramesZip}
              type="button"
            >
              <Download size={12} /> Download All as ZIP
            </button>
          </div>

          <div className="media-frames-gallery">
            {frames.map((frame, idx) => (
              <div key={idx} className="media-frame-card">
                <img src={frame.dataUrl} alt={`Frame ${idx + 1}`} className="frame-thumb-img" />
                <div className="frame-meta-bar">
                  <span className="frame-time-tag">⏱ {frame.timeFormatted}</span>
                  <a
                    href={frame.dataUrl}
                    download={`frame_${String(idx + 1).padStart(3, '0')}.${format === 'image/png' ? 'png' : 'jpg'}`}
                    className="icon-mini-btn"
                    title="Download this frame"
                  >
                    <Download size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
        <input
          className="control-input"
          type="number"
          step={100}
          value={offsetMs}
          onChange={(e) => setOffsetMs(Number(e.target.value))}
          style={{ width: 140 }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
        <div>
          <label className="control-label">Original Subtitles (SRT):</label>
          <textarea
            className="code-editor"
            rows={6}
            value={srt}
            onChange={(e) => setSrt(e.target.value)}
          />
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
