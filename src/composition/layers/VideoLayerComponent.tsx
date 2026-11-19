import React from 'react';
import { Video } from 'remotion';
import { VideoLayer } from '../../types/project';

interface VideoLayerProps {
  layer: VideoLayer;
  src: string;
  compositionWidth: number;
  compositionHeight: number;
}

export const VideoLayerComponent: React.FC<VideoLayerProps> = ({
  layer,
  src,
  compositionWidth,
  compositionHeight,
}) => {
  if (!layer.visible || !src) {
    return null;
  }

  const { transform, opacity, volume, playbackRate, sourceStartTime } = layer;

  // Normalized coordinates (0-1) converted to pixels
  const left = (transform?.x ?? 0) * compositionWidth;
  const top = (transform?.y ?? 0) * compositionHeight;
  const width = (transform?.width ?? 1) * compositionWidth;
  const height = (transform?.height ?? 1) * compositionHeight;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        opacity: opacity ?? 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Video
        src={src}
        volume={volume ?? 1}
        playbackRate={playbackRate ?? 1}
        startFrom={Math.round((sourceStartTime ?? 0) * 30)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};
