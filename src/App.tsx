import { useState } from 'react';
import { VideoWorkflow } from './components/upload/VideoWorkflow';
import { AssetList } from './components/upload/AssetList';
import { ProjectModelInspector } from './components/editor/ProjectModelInspector';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import { useProjectStore } from './stores/projectStore';
import './App.css';

export function App() {
  const [viewMode, setViewMode] = useState<'setup' | 'preview'>('setup');

  const project = useProjectStore((s) => s.project);
  const createNewProject = useProjectStore((s) => s.createNewProject);

  const hasMedia = project.assets.some((a) => a.type === 'video' || a.type === 'audio');

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <span className="logo-icon">🎬</span>
          <div>
            <h1>VidaLoom</h1>
            <span className="milestone-badge">Milestone 2: Subtitle Parsing & Preview Player</span>
          </div>
        </div>

        <div className="header-actions">
          {hasMedia && (
            <div className="view-mode-tabs">
              <button
                className={`tab-btn ${viewMode === 'setup' ? 'active' : ''}`}
                onClick={() => setViewMode('setup')}
              >
                1. Media & Subtitle Setup
              </button>
              <button
                className={`tab-btn ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => setViewMode('preview')}
              >
                2. Preview Player & CC
              </button>
            </div>
          )}

          <button
            className="btn-secondary"
            onClick={() => {
              if (confirm('Create a new project? All unexported changes will be reset.')) {
                createNewProject();
                setViewMode('setup');
              }
            }}
          >
            + New Project
          </button>
        </div>
      </header>

      <main className="main-content">
        {viewMode === 'preview' ? (
          <section className="section-panel highlight-panel">
            <PreviewPlayer onBackToSetup={() => setViewMode('setup')} />
          </section>
        ) : (
          <>
            {/* Primary Media & Subtitle Setup */}
            <section className="section-panel highlight-panel">
              <div className="panel-title-row">
                <h2>Media & Subtitle Setup</h2>
                <span className="panel-desc">
                  Upload a single video or audio file, attach subtitles, and launch preview
                </span>
              </div>

              <VideoWorkflow onProcess={() => setViewMode('preview')} />
            </section>

            {/* Project Model & Active Layers */}
            <section className="section-panel">
              <div className="panel-title-row">
                <h2>Composition Engine & Project Model</h2>
                <span className="panel-desc">
                  Independent, Remotion-decoupled project schema ({project.assets.length} assets, {project.layers.length} layers)
                </span>
              </div>

              <ProjectModelInspector />
            </section>

            {/* Asset Registry */}
            {project.assets.length > 0 && (
              <section className="section-panel">
                <div className="panel-title-row">
                  <h2>Registered Assets Registry</h2>
                  <span className="panel-desc">
                    In-memory asset records with stable IDs and managed object URLs
                  </span>
                </div>

                <AssetList />
              </section>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <span>VidaLoom Architecture: Application-owned project model • Seconds timebase • Normalized coordinates</span>
      </footer>
    </div>
  );
}

export default App;
