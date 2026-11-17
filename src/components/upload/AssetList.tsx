import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { Asset } from '../../types/project';

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
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export const AssetList: React.FC = () => {
  const assets = useProjectStore((s) => s.project.assets);
  const layers = useProjectStore((s) => s.project.layers);
  const removeAsset = useProjectStore((s) => s.removeAsset);
  const createLayerForAsset = useProjectStore((s) => s.createLayerForAsset);

  if (assets.length === 0) {
    return (
      <div className="empty-assets">
        <p>No media assets imported yet. Upload an audio, video, or SRT file above.</p>
      </div>
    );
  }

  return (
    <div className="asset-list-container">
      <div className="asset-list-header">
        <h3>Project Assets ({assets.length})</h3>
        <span className="asset-meta-hint">All assets tracked with stable IDs & isolated metadata</span>
      </div>

      <div className="asset-cards">
        {assets.map((asset: Asset) => {
          const hasLayer = layers.some(
            (l) =>
              ('assetId' in l && l.assetId === asset.id) ||
              ('subtitleAssetId' in l && l.subtitleAssetId === asset.id)
          );

          return (
            <div key={asset.id} className={`asset-card type-${asset.type}`}>
              <div className="asset-badge-row">
                <span className={`badge badge-${asset.type}`}>{asset.type.toUpperCase()}</span>
                <span className="asset-id" title={`Stable ID: ${asset.id}`}>
                  ID: {asset.id.slice(0, 8)}...
                </span>
              </div>

              <div className="asset-title" title={asset.name}>
                {asset.name}
              </div>

              <div className="asset-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Size</span>
                  <span className="detail-val">{formatBytes(asset.size)}</span>
                </div>

                {asset.duration !== undefined && (
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-val">{formatDuration(asset.duration)}</span>
                  </div>
                )}

                {asset.width && asset.height && (
                  <div className="detail-item">
                    <span className="detail-label">Resolution</span>
                    <span className="detail-val">
                      {asset.width}x{asset.height}
                    </span>
                  </div>
                )}

                {asset.subtitleContent && (
                  <div className="detail-item">
                    <span className="detail-label">SRT Cues</span>
                    <span className="detail-val">
                      ~{asset.subtitleContent.split('-->').length - 1} cues
                    </span>
                  </div>
                )}
              </div>

              <div className="asset-actions">
                {!hasLayer && (
                  <button
                    className="btn-create-layer"
                    onClick={() => createLayerForAsset(asset.id)}
                  >
                    + Add Layer
                  </button>
                )}
                <button
                  className="btn-remove-asset"
                  onClick={() => removeAsset(asset.id)}
                  title="Remove asset and release object URL"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
