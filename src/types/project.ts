import { z } from 'zod';

export const AssetTypeSchema = z.enum(['video', 'audio', 'subtitle']);
export type AssetType = z.infer<typeof AssetTypeSchema>;

export const AssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: AssetTypeSchema,
  mimeType: z.string(),
  size: z.number().nonnegative(),
  duration: z.number().nonnegative().optional(), // in seconds
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  subtitleContent: z.string().optional(), // Raw text content for subtitle files
  subtitleFormat: z.enum(['srt', 'vtt', 'ass', 'ssa', 'lrc', 'sub']).optional(),
  subtitleCueCount: z.number().int().nonnegative().optional(),
  createdAt: z.number(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const LayerTypeSchema = z.enum(['video', 'audio', 'caption', 'visualizer']);
export type LayerType = z.infer<typeof LayerTypeSchema>;

export const NormalizedRectSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});
export type NormalizedRect = z.infer<typeof NormalizedRectSchema>;

// Base layer properties common to all layers
const BaseLayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  startTime: z.number().nonnegative(), // seconds
  endTime: z.number().positive(),     // seconds
  zIndex: z.number().int(),
  opacity: z.number().min(0).max(1).default(1),
  visible: z.boolean().default(true),
  transform: NormalizedRectSchema.default({ x: 0, y: 0, width: 1, height: 1 }),
});

export const VideoLayerSchema = BaseLayerSchema.extend({
  type: z.literal('video'),
  assetId: z.string().min(1),
  sourceStartTime: z.number().nonnegative().default(0), // offset in source asset in seconds
  volume: z.number().min(0).max(1).default(1),
  playbackRate: z.number().positive().default(1),
});
export type VideoLayer = z.infer<typeof VideoLayerSchema>;

export const AudioLayerSchema = BaseLayerSchema.extend({
  type: z.literal('audio'),
  assetId: z.string().min(1),
  sourceStartTime: z.number().nonnegative().default(0),
  volume: z.number().min(0).max(1).default(1),
  playbackRate: z.number().positive().default(1),
});
export type AudioLayer = z.infer<typeof AudioLayerSchema>;

export const CaptionStyleSchema = z.object({
  fontSize: z.number().positive().default(32),
  fontFamily: z.string().default('sans-serif'),
  textColor: z.string().default('#ffffff'),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
});
export type CaptionStyle = z.infer<typeof CaptionStyleSchema>;

export const CaptionLayerSchema = BaseLayerSchema.extend({
  type: z.literal('caption'),
  subtitleAssetId: z.string().optional(),
  style: CaptionStyleSchema.default({}),
});
export type CaptionLayer = z.infer<typeof CaptionLayerSchema>;

export const VisualizerStyleSchema = z.enum(['bars', 'wave', 'spectrum']);
export type VisualizerStyle = z.infer<typeof VisualizerStyleSchema>;

export const VisualizerLayerSchema = BaseLayerSchema.extend({
  type: z.literal('visualizer'),
  targetAudioLayerId: z.string().optional(),
  visualizerStyle: VisualizerStyleSchema.default('bars'),
  color: z.string().default('#38bdf8'),
});
export type VisualizerLayer = z.infer<typeof VisualizerLayerSchema>;

export const LayerSchema = z.discriminatedUnion('type', [
  VideoLayerSchema,
  AudioLayerSchema,
  CaptionLayerSchema,
  VisualizerLayerSchema,
]);
export type Layer = z.infer<typeof LayerSchema>;

export const CompositionSettingsSchema = z.object({
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().int().positive().default(30),
  duration: z.number().positive().default(10), // duration in seconds
  backgroundColor: z.string().default('#000000'),
});
export type CompositionSettings = z.infer<typeof CompositionSettingsSchema>;

export const CompositionProjectSchema = z.object({
  id: z.string().min(1),
  version: z.literal(1),
  name: z.string().min(1),
  settings: CompositionSettingsSchema,
  assets: z.array(AssetSchema),
  layers: z.array(LayerSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type CompositionProject = z.infer<typeof CompositionProjectSchema>;
