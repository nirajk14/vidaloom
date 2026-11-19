import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CompositionProject, CaptionStyle, VideoLayer, AudioLayer, CaptionLayer } from '../types/project';
import { CaptionCue } from '../types/caption';
import { BackgroundLayerComponent } from './layers/BackgroundLayerComponent';
import { VideoLayerComponent } from './layers/VideoLayerComponent';
import { AudioLayerComponent } from './layers/AudioLayerComponent';
import { CaptionLayerComponent } from './layers/CaptionLayerComponent';

export interface MainCompositionProps extends Record<string, unknown> {
  project: CompositionProject;
  assetUrls: Record<string, string>;
  cues: CaptionCue[];
  captionStyleOverride?: CaptionStyle;
}

export const MainComposition: React.FC<MainCompositionProps> = ({
  project,
  assetUrls,
  cues,
  captionStyleOverride,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const currentTimeInSeconds = frame / fps;

  // Check if a visible video layer is present with a valid asset URL
  const hasVideoLayer = project.layers.some(
    (l) => l.type === 'video' && l.visible && assetUrls[l.assetId]
  );

  // Sort layers by zIndex
  const sortedLayers = [...project.layers].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        backgroundColor: project.settings.backgroundColor || '#000000',
        overflow: 'hidden',
      }}
    >
      {/* 1. Base Background layer (when no video is present or behind video) */}
      {!hasVideoLayer && (
        <BackgroundLayerComponent
          backgroundColor={project.settings.backgroundColor}
          width={width}
          height={height}
        />
      )}

      {/* 2. Composition Layers */}
      {sortedLayers.map((layer) => {
        if (!layer.visible) return null;

        // Video Layer
        if (layer.type === 'video') {
          const videoLayer = layer as VideoLayer;
          const url = assetUrls[videoLayer.assetId];
          if (!url) return null;

          return (
            <VideoLayerComponent
              key={layer.id}
              layer={videoLayer}
              src={url}
              compositionWidth={width}
              compositionHeight={height}
            />
          );
        }

        // Audio Layer
        if (layer.type === 'audio') {
          const audioLayer = layer as AudioLayer;
          const url = assetUrls[audioLayer.assetId];
          if (!url) return null;

          return <AudioLayerComponent key={layer.id} layer={audioLayer} src={url} />;
        }

        // Caption Layer
        if (layer.type === 'caption') {
          const captionLayer = layer as CaptionLayer;
          return (
            <CaptionLayerComponent
              key={layer.id}
              layer={captionLayer}
              cues={cues}
              currentTimeInSeconds={currentTimeInSeconds}
              compositionWidth={width}
              compositionHeight={height}
              styleOverride={captionStyleOverride}
            />
          );
        }

        return null;
      })}

      {/* Fallback Caption Overlay if cues exist but no caption layer was explicitly added */}
      {cues.length > 0 && !project.layers.some((l) => l.type === 'caption') && (
        <CaptionLayerComponent
          layer={{
            id: 'fallback-captions',
            name: 'Subtitles',
            type: 'caption',
            startTime: 0,
            endTime: project.settings.duration,
            zIndex: 99,
            opacity: 1,
            visible: true,
            transform: { x: 0.05, y: 0.78, width: 0.9, height: 0.15 },
            style: {
              fontSize: 28,
              fontFamily: 'sans-serif',
              textColor: 'rgba(255, 255, 255, 1)',
              textOpacity: 1,
              backgroundColor: 'rgba(8, 8, 8, 0.75)',
              backgroundOpacity: 0.75,
              textAlign: 'center',
              padding: '4px 8px',
              borderRadius: 4,
            },
          }}
          cues={cues}
          currentTimeInSeconds={currentTimeInSeconds}
          compositionWidth={width}
          compositionHeight={height}
          styleOverride={captionStyleOverride}
        />
      )}
    </div>
  );
};
