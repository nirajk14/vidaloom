import { describe, it, expect, beforeEach, vi } from 'vitest';
import { assetRegistry } from '../src/engine/media/assetRegistry';
import { Asset } from '../src/types/project';

describe('AssetRegistry', () => {
  beforeEach(() => {
    assetRegistry.revokeAll();
  });

  it('registers and retrieves assets with stable IDs and URLs', () => {
    const asset: Asset = {
      id: 'test-asset-123',
      name: 'sample.mp3',
      type: 'audio',
      mimeType: 'audio/mpeg',
      size: 50000,
      duration: 3.5,
      createdAt: Date.now(),
    };

    const mockFile = new File(['dummy content'], 'sample.mp3', { type: 'audio/mpeg' });
    const mockUrl = 'blob:http://localhost:5173/mock-uuid-1';

    assetRegistry.register(asset, mockFile, mockUrl);

    expect(assetRegistry.count).toBe(1);
    expect(assetRegistry.get('test-asset-123')?.asset.name).toBe('sample.mp3');
    expect(assetRegistry.getUrl('test-asset-123')).toBe(mockUrl);
    expect(assetRegistry.getFile('test-asset-123')).toBe(mockFile);
  });

  it('revokes object URL when asset is removed', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const asset: Asset = {
      id: 'test-asset-456',
      name: 'video.mp4',
      type: 'video',
      mimeType: 'video/mp4',
      size: 100000,
      createdAt: Date.now(),
    };

    const mockFile = new File(['dummy video'], 'video.mp4', { type: 'video/mp4' });
    const mockUrl = 'blob:http://localhost:5173/mock-uuid-2';

    assetRegistry.register(asset, mockFile, mockUrl);
    expect(assetRegistry.count).toBe(1);

    const revoked = assetRegistry.revoke('test-asset-456');
    expect(revoked).toBe(true);
    expect(assetRegistry.count).toBe(0);
    expect(assetRegistry.get('test-asset-456')).toBeUndefined();
    expect(revokeSpy).toHaveBeenCalledWith(mockUrl);

    revokeSpy.mockRestore();
  });

  it('revokes all URLs on revokeAll', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const asset1: Asset = {
      id: 'asset-1',
      name: '1.mp3',
      type: 'audio',
      mimeType: 'audio/mpeg',
      size: 10,
      createdAt: Date.now(),
    };
    const asset2: Asset = {
      id: 'asset-2',
      name: '2.mp4',
      type: 'video',
      mimeType: 'video/mp4',
      size: 20,
      createdAt: Date.now(),
    };

    const file1 = new File(['1'], '1.mp3', { type: 'audio/mpeg' });
    const file2 = new File(['2'], '2.mp4', { type: 'video/mp4' });

    assetRegistry.register(asset1, file1, 'blob:url-1');
    assetRegistry.register(asset2, file2, 'blob:url-2');

    expect(assetRegistry.count).toBe(2);

    assetRegistry.revokeAll();
    expect(assetRegistry.count).toBe(0);
    expect(revokeSpy).toHaveBeenCalledTimes(2);

    revokeSpy.mockRestore();
  });
});
