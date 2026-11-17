import { VideoWorkflow } from './components/upload/VideoWorkflow';
import { AssetList } from './components/upload/AssetList';
import { ProjectModelInspector } from './components/editor/ProjectModelInspector';
import { useProjectStore } from './stores/projectStore';
import './App.css';

export function App() {
  const project = useProjectStore((s) => s.project);
  const createNewProject = useProjectStore((s) => s.createNewProject);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <span className="logo-icon">🎬</span>
          <div>
            <h1>VidaLoom</h1>
            <span className="milestone-badge">Video & Subtitle Composer</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              if (confirm('Create a new project? All unexported changes will be reset.')) {
                createNewProject();
              }
            }}
          >
            + New Project
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Primary Single Video & Subtitle Workflow */}
        <section className="section-panel highlight-panel">
          <div className="panel-title-row">
            <h2>Video Composition Setup</h2>
            <span className="panel-desc">
              Upload a single video file, verify subtitle status, and prepare composition
            </span>
          </div>

          <VideoWorkflow />
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
      </main>

      <footer className="app-footer">
        <span>VidaLoom Architecture: Application-owned project model • Seconds timebase • Normalized coordinates</span>
      </footer>
    </div>
  );
}

export default App;
