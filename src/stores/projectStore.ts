import { create } from 'zustand';
import {
  CompositionProject,
  CompositionSettings,
  Layer,
  Asset,
  VideoLayer,
  AudioLayer,
  CaptionLayer,
} from '../types/project';
import { createDefaultProject, validateProject } from '../engine/project/projectSchema';
import { importFile } from '../engine/media/fileImport';
import { assetRegistry } from '../engine/media/assetRegistry';

interface ProjectState {
  project: CompositionProject;
  selectedLayerId: string | null;

  // Actions
  createNewProject: (name?: string) => void;
  updateSettings: (settings: Partial<CompositionSettings>) => void;
  importMediaFile: (file: File) => Promise<Asset>;
  removeAsset: (assetId: string) => void;
  createLayerForAsset: (assetId: string) => Layer | null;
  addLayer: (layer: Layer) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (layerId: string) => void;
  selectLayer: (layerId: string | null) => void;
  loadProjectFromData: (data: unknown) => void;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  selectedLayerId: null,

  createNewProject: (name) => {
    assetRegistry.revokeAll();
    set({
      project: createDefaultProject(name),
      selectedLayerId: null,
    });
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      project: {
        ...state.project,
        settings: {
          ...state.project.settings,
          ...newSettings,
        },
        updatedAt: Date.now(),
      },
    }));
  },

  importMediaFile: async (file: File) => {
    const { asset } = await importFile(file);

    set((state) => {
      // Adjust project duration if the imported asset has longer duration
      let newDuration = state.project.settings.duration;
      if (asset.duration && asset.duration > newDuration) {
        newDuration = Math.ceil(asset.duration);
      }

      return {
        project: {
          ...state.project,
          settings: {
            ...state.project.settings,
            duration: newDuration,
          },
          assets: [...state.project.assets, asset],
          updatedAt: Date.now(),
        },
      };
    });

    // Automatically create a layer for this asset if no layer exists for it yet
    get().createLayerForAsset(asset.id);

    return asset;
  },

  removeAsset: (assetId: string) => {
    assetRegistry.revoke(assetId);

    set((state) => ({
      project: {
        ...state.project,
        assets: state.project.assets.filter((a) => a.id !== assetId),
        // Remove or detach layers that depended on this asset
        layers: state.project.layers.filter((layer) => {
          if (layer.type === 'video' || layer.type === 'audio') {
            return layer.assetId !== assetId;
          }
          if (layer.type === 'caption') {
            return layer.subtitleAssetId !== assetId;
          }
          return true;
        }),
        updatedAt: Date.now(),
      },
      selectedLayerId: state.selectedLayerId === assetId ? null : state.selectedLayerId,
    }));
  },

  createLayerForAsset: (assetId: string) => {
    const state = get();
    const asset = state.project.assets.find((a) => a.id === assetId);
    if (!asset) return null;

    const layerId = crypto.randomUUID();
    const zIndex = state.project.layers.length;
    const duration = asset.duration || state.project.settings.duration;

    let newLayer: Layer;

    if (asset.type === 'video') {
      const videoLayer: VideoLayer = {
        id: layerId,
        name: `Video: ${asset.name}`,
        type: 'video',
        assetId: asset.id,
        startTime: 0,
        endTime: duration,
        sourceStartTime: 0,
        volume: 1,
        playbackRate: 1,
        zIndex,
        opacity: 1,
        visible: true,
        transform: { x: 0, y: 0, width: 1, height: 1 },
      };
      newLayer = videoLayer;
    } else if (asset.type === 'audio') {
      const audioLayer: AudioLayer = {
        id: layerId,
        name: `Audio: ${asset.name}`,
        type: 'audio',
        assetId: asset.id,
        startTime: 0,
        endTime: duration,
        sourceStartTime: 0,
        volume: 1,
        playbackRate: 1,
        zIndex,
        opacity: 1,
        visible: true,
        transform: { x: 0, y: 0, width: 1, height: 1 },
      };
      newLayer = audioLayer;
    } else if (asset.type === 'subtitle') {
      const captionLayer: CaptionLayer = {
        id: layerId,
        name: `Captions: ${asset.name}`,
        type: 'caption',
        subtitleAssetId: asset.id,
        startTime: 0,
        endTime: state.project.settings.duration,
        zIndex,
        opacity: 1,
        visible: true,
        transform: { x: 0.1, y: 0.8, width: 0.8, height: 0.15 },
        style: {
          fontSize: 36,
          fontFamily: 'sans-serif',
          textColor: '#ffffff',
          textAlign: 'center',
        },
      };
      newLayer = captionLayer;
    } else {
      return null;
    }

    set((curr) => ({
      project: {
        ...curr.project,
        layers: [...curr.project.layers, newLayer],
        updatedAt: Date.now(),
      },
      selectedLayerId: newLayer.id,
    }));

    return newLayer;
  },

  addLayer: (layer) => {
    set((state) => ({
      project: {
        ...state.project,
        layers: [...state.project.layers, layer],
        updatedAt: Date.now(),
      },
      selectedLayerId: layer.id,
    }));
  },

  updateLayer: (layerId, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((l) =>
          l.id === layerId ? ({ ...l, ...updates } as Layer) : l
        ),
        updatedAt: Date.now(),
      },
    }));
  },

  removeLayer: (layerId) => {
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.filter((l) => l.id !== layerId),
        updatedAt: Date.now(),
      },
      selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
    }));
  },

  selectLayer: (layerId) => {
    set({ selectedLayerId: layerId });
  },

  loadProjectFromData: (data) => {
    const validated = validateProject(data);
    assetRegistry.revokeAll();
    set({
      project: validated,
      selectedLayerId: null,
    });
  },

  resetProject: () => {
    assetRegistry.revokeAll();
    set({
      project: createDefaultProject(),
      selectedLayerId: null,
    });
  },
}));
