import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';

export const FileImport: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMediaFile = useProjectStore((s) => s.importMediaFile);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await importMediaFile(file);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred during file import.');
      }
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="file-import-section">
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a,.aac,.srt"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-icon">📁</div>
        <div className="dropzone-text">
          {isLoading ? (
            <p className="dropzone-loading">Analyzing media and extracting metadata...</p>
          ) : (
            <>
              <p className="dropzone-title">Click to upload or drag & drop files</p>
              <p className="dropzone-subtitle">
                Supported: Video (MP4, WebM), Audio (MP3, WAV), Subtitles (.srt)
              </p>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{errorMessage}</span>
          <button className="error-close" onClick={() => setErrorMessage(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
