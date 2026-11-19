import React from 'react';
import { Audio } from 'remotion';
import { AudioLayer } from '../../types/project';

interface AudioLayerProps {
  layer: AudioLayer;
  src: string;
}

export const AudioLayerComponent: React.FC<AudioLayerProps> = ({ layer, src }) => {
  if (!layer.visible || !src) {
    return null;
  }

  const { volume, playbackRate, sourceStartTime } = layer;

  return (
    <Audio
      src={src}
      volume={volume ?? 1}
      playbackRate={playbackRate ?? 1}
      startFrom={Math.round((sourceStartTime ?? 0) * 30)}
    />
  );
};
