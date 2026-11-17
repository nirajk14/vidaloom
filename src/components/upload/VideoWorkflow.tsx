import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { checkVideoSubtitles, VideoSubtitleCheckResult } from '../../engine/media/subtitleDetector';

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
  const videoInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  const project = useProjectStore((s) => s.project);
  const importMediaFile = useProjectStore((s) => s.importMediaFile);
  const removeAsset = useProjectStore((s) => s.removeAsset);

  // Find the primary video asset and subtitle asset if already in project
  const videoAsset = project.assets.find((a) => a.type === 'video');
  const subtitleAsset = project.assets.find((a) => a.type === 'subtitle');

  const [isCheckingSubtitles, setIsCheckingSubtitles] = useState(false);
  const [subtitleCheckResult, setSubtitleCheckResult] = useState<VideoSubtitleCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processClicked, setProcessClicked] = useState(false);

  // Handle single video file upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let file: File | undefined;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }

    if (!file) return;

    // Check if it is a video file
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    if (!isVideo) {
      setErrorMessage(`"${file.name}" is not a valid video file. Please upload an MP4, WebM, or MOV video.`);
      return;
    }

    try {
      // If there's an existing video, remove it first
      if (videoAsset) {
        removeAsset(videoAsset.id);
      }

      setIsCheckingSubtitles(true);
      setSubtitleCheckResult(null);

      // Check subtitles in parallel with importing
      const subtitleCheckPromise = checkVideoSubtitles(file);
      await importMediaFile(file);
      const subResult = await subtitleCheckPromise;

      setSubtitleCheckResult(subResult);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to import video file.');
    } finally {
      setIsCheckingSubtitles(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // Handle subtitle (.srt) file upload
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

    if (!file.name.toLowerCase().endsWith('.srt') && file.type !== 'application/x-subrip') {
      setErrorMessage(`"${file.name}" is not an SRT subtitle file. Please upload a .srt file.`);
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
      if (srtInputRef.current) srtInputRef.current.value = '';
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

      {/* Step 1: Single Video File Upload */}
      <div className="workflow-step">
        <div className="step-header">
          <span className="step-number">1</span>
          <h4>Video File</h4>
        </div>

        {!videoAsset ? (
          <div
            className="single-upload-box"
            onClick={() => videoInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleVideoUpload}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept=".mp4,.webm,.mov,video/*"
              style={{ display: 'none' }}
              onChange={handleVideoUpload}
            />
            <div className="upload-icon">🎥</div>
            <p className="upload-prompt">Click to select or drop a single video file</p>
            <span className="upload-hint">Supported formats: MP4, WebM, MOV</span>
          </div>
        ) : (
          <div className="uploaded-video-banner">
            <div className="video-info">
              <span className="video-icon">🎬</span>
              <div className="video-meta">
                <span className="video-name">{videoAsset.name}</span>
                <span className="video-specs">
                  {videoAsset.width && videoAsset.height ? `${videoAsset.width}x${videoAsset.height} • ` : ''}
                  {formatDuration(videoAsset.duration)} • {formatBytes(videoAsset.size)}
                </span>
              </div>
            </div>

            <button
              className="btn-change-video"
              onClick={() => {
                removeAsset(videoAsset.id);
                setSubtitleCheckResult(null);
              }}
            >
              Replace Video
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Subtitle Detection & Subtitle File Prompt */}
      {videoAsset && (
        <div className="workflow-step">
          <div className="step-header">
            <span className="step-number">2</span>
            <h4>Subtitle Status</h4>
          </div>

          {isCheckingSubtitles ? (
            <div className="subtitle-checking">
              <span className="spinner">⏳</span>
              <span>Checking video file for embedded subtitles...</span>
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
                  <strong>No subtitle found in video</strong>
                  <p>This video does not contain embedded subtitle tracks.</p>
                </div>
              </div>

              {/* Ask for Subtitle File */}
              <div className="subtitle-request-section">
                <h5>Please upload a subtitle file (.srt):</h5>

                {!subtitleAsset ? (
                  <div
                    className="single-upload-box subtitle-upload-box"
                    onClick={() => srtInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleSubtitleUpload}
                  >
                    <input
                      ref={srtInputRef}
                      type="file"
                      accept=".srt"
                      style={{ display: 'none' }}
                      onChange={handleSubtitleUpload}
                    />
                    <div className="upload-icon">💬</div>
                    <p className="upload-prompt">Click to select or drop your .srt subtitle file</p>
                    <span className="upload-hint">SRT format with timestamps</span>
                  </div>
                ) : (
                  <div className="uploaded-subtitle-banner">
                    <div className="sub-info">
                      <span className="sub-badge">SRT</span>
                      <div>
                        <span className="sub-name">{subtitleAsset.name}</span>
                        <span className="sub-cues">
                          ~{(subtitleAsset.subtitleContent?.split('-->').length ?? 1) - 1} cues •{' '}
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
          disabled={!videoAsset}
        >
          {processClicked ? 'Processing (Ready for next milestone)...' : 'Process Video'}
        </button>

        <span className="process-hint">
          {!videoAsset
            ? 'Upload a video above to enable processing.'
            : 'Click "Process Video" (Action placeholder — will run composition pipeline in later milestone)'}
        </span>
      </div>
    </div>
  );
};
