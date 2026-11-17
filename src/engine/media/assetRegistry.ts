import { Asset } from '../../types/project';

export interface AssetRecord {
  asset: Asset;
  file: File;
  objectUrl: string;
}

/**
 * In-memory asset registry holding runtime browser resources (File, ObjectURL).
 * Keeps heavy browser objects separate from the serializable project schema.
 */
class AssetRegistry {
  private records = new Map<string, AssetRecord>();

  /**
   * Registers an asset with its underlying File and created object URL.
   */
  register(asset: Asset, file: File, objectUrl: string): void {
    // If an asset with the same ID already exists, revoke its old URL first
    if (this.records.has(asset.id)) {
      this.revoke(asset.id);
    }

    this.records.set(asset.id, {
      asset,
      file,
      objectUrl,
    });
  }

  /**
   * Gets an asset record by ID.
   */
  get(assetId: string): AssetRecord | undefined {
    return this.records.get(assetId);
  }

  /**
   * Returns the preview/playback object URL for an asset.
   */
  getUrl(assetId: string): string | undefined {
    return this.records.get(assetId)?.objectUrl;
  }

  /**
   * Returns the underlying browser File object.
   */
  getFile(assetId: string): File | undefined {
    return this.records.get(assetId)?.file;
  }

  /**
   * Revokes the object URL and unregisters the asset.
   */
  revoke(assetId: string): boolean {
    const record = this.records.get(assetId);
    if (!record) return false;

    try {
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(record.objectUrl);
      }
    } catch (e) {
      console.warn(`Failed to revoke object URL for asset ${assetId}:`, e);
    }

    this.records.delete(assetId);
    return true;
  }

  /**
   * Revokes all object URLs and clears the registry.
   */
  revokeAll(): void {
    for (const record of this.records.values()) {
      try {
        if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
          URL.revokeObjectURL(record.objectUrl);
        }
      } catch (e) {
        console.warn(`Failed to revoke object URL:`, e);
      }
    }
    this.records.clear();
  }

  /**
   * Returns the count of registered assets.
   */
  get count(): number {
    return this.records.size;
  }
}

export const assetRegistry = new AssetRegistry();
