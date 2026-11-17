import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '../src/stores/projectStore';
import { assetRegistry } from '../src/engine/media/assetRegistry';

describe('ProjectStore (Zustand)', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject();
    assetRegistry.revokeAll();
  });

  it('initializes with a valid default project model', () => {
    const project = useProjectStore.getState().project;
    expect(project.id).toBeDefined();
    expect(project.version).toBe(1);
    expect(project.settings.duration).toBe(10);
    expect(project.assets).toHaveLength(0);
    expect(project.layers).toHaveLength(0);
  });

  it('updates composition settings', () => {
    useProjectStore.getState().updateSettings({
      width: 3840,
      height: 2160,
      fps: 60,
      duration: 30,
    });

    const settings = useProjectStore.getState().project.settings;
    expect(settings.width).toBe(3840);
    expect(settings.height).toBe(2160);
    expect(settings.fps).toBe(60);
    expect(settings.duration).toBe(30);
  });

  it('imports subtitle asset, creates asset record with stable ID, and creates caption layer', async () => {
    const srtContent = `1\n00:00:00,500 --> 00:00:02,000\nSub title test`;
    const srtFile = new File([srtContent], 'subs.srt', { type: 'text/plain' });

    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:sub-url');

    const asset = await useProjectStore.getState().importMediaFile(srtFile);

    const state = useProjectStore.getState();
    expect(state.project.assets).toHaveLength(1);
    expect(state.project.assets[0].id).toBe(asset.id);
    expect(state.project.assets[0].name).toBe('subs.srt');

    // Verify caption layer was auto-created and references the asset by ID
    expect(state.project.layers).toHaveLength(1);
    const layer = state.project.layers[0];
    expect(layer.type).toBe('caption');
    if (layer.type === 'caption') {
      expect(layer.subtitleAssetId).toBe(asset.id);
    }

    createUrlSpy.mockRestore();
  });

  it('removes asset, cleans up dependent layers, and revokes object URL in assetRegistry', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-asset-url');

    const srtContent = `1\n00:00:00,500 --> 00:00:02,000\nSub title test`;
    const srtFile = new File([srtContent], 'subs.srt', { type: 'text/plain' });

    const asset = await useProjectStore.getState().importMediaFile(srtFile);

    expect(useProjectStore.getState().project.assets).toHaveLength(1);
    expect(useProjectStore.getState().project.layers).toHaveLength(1);

    // Remove the asset
    useProjectStore.getState().removeAsset(asset.id);

    const state = useProjectStore.getState();
    expect(state.project.assets).toHaveLength(0);
    // Associated layer should also be removed
    expect(state.project.layers).toHaveLength(0);
    // Object URL should have been revoked
    expect(revokeSpy).toHaveBeenCalledWith('blob:test-asset-url');

    revokeSpy.mockRestore();
    createUrlSpy.mockRestore();
  });

  it('ensures project model never stores raw File objects', async () => {
    const srtContent = `1\n00:00:01,000 --> 00:00:02,000\nTest cue`;
    const srtFile = new File([srtContent], 'test.srt', { type: 'text/plain' });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    await useProjectStore.getState().importMediaFile(srtFile);

    const project = useProjectStore.getState().project;

    // Check JSON serializability
    const jsonString = JSON.stringify(project);
    const parsed = JSON.parse(jsonString);

    expect(parsed.assets[0].id).toBe(project.assets[0].id);
    expect(parsed.assets[0].name).toBe('test.srt');
    // Ensure no raw File object exists in asset schema
    expect(parsed.assets[0].file).toBeUndefined();
  });
});
