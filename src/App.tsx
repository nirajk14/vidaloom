import { FileImport } from './components/upload/FileImport';
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
            <span className="milestone-badge">Milestone 1: Project Model & File Import</span>
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
        <section className="section-panel">
          <div className="panel-title-row">
            <h2>Media & Subtitle Assets</h2>
            <span className="panel-desc">
              Import local audio, video, and SRT files to register assets and build composition layers
            </span>
          </div>

          <FileImport />
          <AssetList />
        </section>

        <section className="section-panel">
          <div className="panel-title-row">
            <h2>Composition Engine & Project Model</h2>
            <span className="panel-desc">
              Independent, Remotion-decoupled project schema ({project.assets.length} assets, {project.layers.length} layers)
            </span>
          </div>

          <ProjectModelInspector />
        </section>
      </main>

      <footer className="app-footer">
        <span>VidaLoom Architecture: Application-owned project model • Seconds timebase • Normalized coordinates</span>
      </footer>
    </div>
  );
}

export default App;
