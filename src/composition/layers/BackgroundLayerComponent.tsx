import React from 'react';

interface BackgroundLayerProps {
  backgroundColor?: string;
  width: number;
  height: number;
}

export const BackgroundLayerComponent: React.FC<BackgroundLayerProps> = ({
  backgroundColor = '#000000',
  width,
  height,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle modern vignette / studio gradient */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(30, 32, 45, 0.4) 0%, rgba(10, 11, 16, 0.95) 100%)',
        }}
      />
    </div>
  );
};
