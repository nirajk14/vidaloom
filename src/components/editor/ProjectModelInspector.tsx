import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { safeValidateProject } from '../../engine/project/projectSchema';
import { Layer } from '../../types/project';

export const ProjectModelInspector: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const selectedLayerId = useProjectStore((s) => s.selectedLayerId);
  const selectLayer = useProjectStore((s) => s.selectLayer);
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const removeLayer = useProjectStore((s) => s.removeLayer);

  const [showJson, setShowJson] = useState(false);

  // Perform live Zod validation on the in-memory model
  const validationResult = safeValidateProject(project);

  return (
    <div className="inspector-container">
      <div className="inspector-header">
        <div className="header-left">
          <h3>Composition Timeline & Layers ({project.layers.length})</h3>
          <span className="project-id-badge" title={project.id}>
            Project: {project.name}
          </span>
        </div>

        <div className="header-right">
          {validationResult.success ? (
            <span className="validation-badge valid">✓ Zod Schema Valid</span>
          ) : (
            <span className="validation-badge invalid">✕ Schema Invalid</span>
          )}

          <button
            className="btn-toggle-json"
            onClick={() => setShowJson(!showJson)}
          >
            {showJson ? 'Hide JSON' : 'Inspect JSON'}
          </button>
        </div>
      </div>

      <div className="project-settings-bar">
        <div className="setting-pill">
          <span className="pill-label">Resolution</span>
          <span className="pill-value">
            {project.settings.width}x{project.settings.height}
          </span>
        </div>
        <div className="setting-pill">
          <span className="pill-label">Framerate</span>
          <span className="pill-value">{project.settings.fps} FPS</span>
        </div>
        <div className="setting-pill">
          <span className="pill-label">Total Duration</span>
          <span className="pill-value">{project.settings.duration}s</span>
        </div>
      </div>

      {project.layers.length === 0 ? (
        <div className="empty-layers">
          <p>No layers in composition. Import an asset or add a layer to get started.</p>
        </div>
      ) : (
        <div className="layers-list">
          {project.layers.map((layer: Layer, index: number) => {
            const isSelected = selectedLayerId === layer.id;
            return (
              <div
                key={layer.id}
                className={`layer-item ${isSelected ? 'selected' : ''} ${!layer.visible ? 'hidden' : ''}`}
                onClick={() => selectLayer(layer.id)}
              >
                <div className="layer-left">
                  <span className="layer-index">#{index + 1}</span>
                  <span className={`layer-type-tag type-${layer.type}`}>
                    {layer.type}
                  </span>
                  <span className="layer-name">{layer.name}</span>
                </div>

                <div className="layer-center">
                  <span className="layer-timing">
                    {layer.startTime.toFixed(1)}s → {layer.endTime.toFixed(1)}s (
                    {(layer.endTime - layer.startTime).toFixed(1)}s)
                  </span>
                  <span className="layer-z">z-index: {layer.zIndex}</span>
                </div>

                <div className="layer-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`btn-visibility ${layer.visible ? 'active' : ''}`}
                    onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? '👁️' : '🚫'}
                  </button>

                  <button
                    className="btn-remove-layer"
                    onClick={() => removeLayer(layer.id)}
                    title="Remove layer from composition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showJson && (
        <div className="json-viewer-drawer">
          <div className="json-viewer-header">
            <h4>In-Memory Composition Project JSON</h4>
            <span className="json-notice">
              (Notice: References asset IDs only; zero embedded File objects or ObjectURLs)
            </span>
          </div>
          <pre className="json-content">
            {JSON.stringify(project, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
