import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { checkMediaSubtitles, MediaSubtitleCheckResult } from '../../engine/media/subtitleDetector';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const VideoWorkflow: React.FC = () => {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  const project = useProjectStore((s) => s.project);
  const importMediaFile = useProjectStore((s) => s.importMediaFile);
  const removeAsset = useProjectStore((s) => s.removeAsset);

  // Find the primary media asset (video or audio) and subtitle asset if already in project
  const primaryMediaAsset = project.assets.find((a) => a.type === 'video' || a.type === 'audio');
  const subtitleAsset = project.assets.find((a) => a.type === 'subtitle');

  const [isCheckingSubtitles, setIsCheckingSubtitles] = useState(false);
  const [subtitleCheckResult, setSubtitleCheckResult] = useState<MediaSubtitleCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processClicked, setProcessClicked] = useState(false);

  // Handle single video or audio file upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let file: File | undefined;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }

    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);

    if (!isVideo && !isAudio) {
      setErrorMessage(
        `"${file.name}" is not a supported media file. Please upload Video (MP4, WebM, MOV) or Audio (MP3, WAV, OGG, M4A, AAC, FLAC).`
      );
      return;
    }

    try {
      // If there's an existing primary media asset, remove it first
      if (primaryMediaAsset) {
        removeAsset(primaryMediaAsset.id);
      }

      setIsCheckingSubtitles(true);
      setSubtitleCheckResult(null);

      // Check subtitles in parallel with importing
      const subtitleCheckPromise = checkMediaSubtitles(file);
      await importMediaFile(file);
      const subResult = await subtitleCheckPromise;

      setSubtitleCheckResult(subResult);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to import media file.');
    } finally {
      setIsCheckingSubtitles(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  // Handle subtitle / lyric file upload (.srt, .vtt, .ass, .ssa, .lrc, .sub)
  const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let file: File | undefined;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }

    if (!file) return;

    const isSubtitleOrLyric =
      /\.(srt|vtt|ass|ssa|lrc|sub)$/i.test(file.name) ||
      file.type === 'application/x-subrip' ||
      file.type === 'text/vtt';

    if (!isSubtitleOrLyric) {
      setErrorMessage(
        `"${file.name}" is not a recognized subtitle or lyric file. Please upload an SRT, WebVTT (.vtt), ASS, or LRC file.`
      );
      return;
    }

    try {
      if (subtitleAsset) {
        removeAsset(subtitleAsset.id);
      }
      await importMediaFile(file);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to import subtitle file.');
    } finally {
      if (subInputRef.current) subInputRef.current.value = '';
    }
  };

  const handleProcessClick = () => {
    // Process button does nothing for now
    setProcessClicked(true);
    setTimeout(() => setProcessClicked(false), 2500);
  };

  return (
    <div className="workflow-card">
      {errorMessage && (
        <div className="workflow-error">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      {/* Step 1: Single Video or Audio File Upload */}
      <div className="workflow-step">
        <div className="step-header">
          <span className="step-number">1</span>
          <h4>Media File (Video or Audio)</h4>
        </div>

        {!primaryMediaAsset ? (
          <div
            className="single-upload-box"
            onClick={() => mediaInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMediaUpload}
          >
            <input
              ref={mediaInputRef}
              type="file"
              accept=".mp4,.webm,.mov,.mkv,.mp3,.wav,.ogg,.m4a,.aac,.flac,video/*,audio/*"
              style={{ display: 'none' }}
              onChange={handleMediaUpload}
            />
            <div className="upload-icon">🎬 🎵</div>
            <p className="upload-prompt">Click to select or drop a single Video or Audio file</p>
            <span className="upload-hint">
              Video (MP4, WebM, MOV) or Audio (MP3, WAV, OGG, M4A, AAC, FLAC)
            </span>
          </div>
        ) : (
          <div className="uploaded-video-banner">
            <div className="video-info">
              <span className="video-icon">{primaryMediaAsset.type === 'video' ? '🎬' : '🎵'}</span>
              <div className="video-meta">
                <span className="video-name">{primaryMediaAsset.name}</span>
                <span className="video-specs">
                  <span className="media-type-pill">{primaryMediaAsset.type.toUpperCase()}</span>
                  {' • '}
                  {primaryMediaAsset.width && primaryMediaAsset.height
                    ? `${primaryMediaAsset.width}x${primaryMediaAsset.height} • `
                    : ''}
                  {formatDuration(primaryMediaAsset.duration)} • {formatBytes(primaryMediaAsset.size)}
                </span>
              </div>
            </div>

            <button
              className="btn-change-video"
              onClick={() => {
                removeAsset(primaryMediaAsset.id);
                setSubtitleCheckResult(null);
              }}
            >
              Replace Media
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Subtitle Status & Multi-format Subtitle File Prompt */}
      {primaryMediaAsset && (
        <div className="workflow-step">
          <div className="step-header">
            <span className="step-number">2</span>
            <h4>Subtitle Status</h4>
          </div>

          {isCheckingSubtitles ? (
            <div className="subtitle-checking">
              <span className="spinner">⏳</span>
              <span>Checking media for embedded subtitles...</span>
            </div>
          ) : subtitleCheckResult?.hasSubtitles ? (
            <div className="subtitle-status-found">
              <span className="status-icon">✓</span>
              <div>
                <strong>Embedded Subtitles Found:</strong>
                <p>
                  Found {subtitleCheckResult.trackCount} subtitle track(s):{' '}
                  {subtitleCheckResult.trackNames.join(', ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="subtitle-missing-container">
              <div className="no-subtitle-alert">
                <span className="alert-icon">ℹ️</span>
                <div>
                  <strong>
                    {primaryMediaAsset.type === 'audio'
                      ? 'No subtitle found in audio'
                      : 'No subtitle found in video'}
                  </strong>
                  <p>
                    {primaryMediaAsset.type === 'audio'
                      ? 'Audio files do not contain embedded subtitles.'
                      : 'This video file does not contain embedded subtitle tracks.'}
                  </p>
                </div>
              </div>

              {/* Ask for Subtitle / Lyrics File */}
              <div className="subtitle-request-section">
                <h5>
                  Please upload a subtitle or lyric file (.srt, .vtt, .ass, .lrc):
                </h5>

                {!subtitleAsset ? (
                  <div
                    className="single-upload-box subtitle-upload-box"
                    onClick={() => subInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleSubtitleUpload}
                  >
                    <input
                      ref={subInputRef}
                      type="file"
                      accept=".srt,.vtt,.ass,.ssa,.lrc,.sub"
                      style={{ display: 'none' }}
                      onChange={handleSubtitleUpload}
                    />
                    <div className="upload-icon">💬</div>
                    <p className="upload-prompt">
                      Click to select or drop your subtitle/lyrics file
                    </p>
                    <span className="upload-hint">
                      Supported: SubRip (.srt), WebVTT (.vtt), SubStation (.ass), Lyrics (.lrc)
                    </span>
                  </div>
                ) : (
                  <div className="uploaded-subtitle-banner">
                    <div className="sub-info">
                      <span className="sub-badge">
                        {(subtitleAsset.subtitleFormat || 'SRT').toUpperCase()}
                      </span>
                      <div>
                        <span className="sub-name">{subtitleAsset.name}</span>
                        <span className="sub-cues">
                          ~{subtitleAsset.subtitleCueCount ?? 1} cues •{' '}
                          {formatBytes(subtitleAsset.size)}
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-change-video"
                      onClick={() => removeAsset(subtitleAsset.id)}
                    >
                      Remove Subtitle
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Process Button (Does nothing for now) */}
      <div className="workflow-step process-step">
        <button
          className={`btn-process ${processClicked ? 'clicked' : ''}`}
          onClick={handleProcessClick}
          disabled={!primaryMediaAsset}
        >
          {processClicked ? 'Processing (Ready for next milestone)...' : 'Process Media'}
        </button>

        <span className="process-hint">
          {!primaryMediaAsset
            ? 'Upload a video or audio file above to enable processing.'
            : 'Click "Process Media" (Action placeholder — does nothing for now)'}
        </span>
      </div>
    </div>
  );
};
