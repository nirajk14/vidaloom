import {
  CompositionProject,
  CompositionProjectSchema,
} from '../../types/project';

/**
 * Validates external or untrusted project JSON against the schema.
 * Throws ZodError if invalid, or returns the parsed typed object.
 */
export function validateProject(data: unknown): CompositionProject {
  return CompositionProjectSchema.parse(data);
}

/**
 * Safe validator that returns a result object instead of throwing.
 */
export function safeValidateProject(data: unknown) {
  return CompositionProjectSchema.safeParse(data);
}

/**
 * Creates a brand new default empty project model.
 */
export function createDefaultProject(name = 'Untitled Project'): CompositionProject {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    version: 1,
    name,
    settings: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 10, // default 10 seconds
      backgroundColor: '#000000',
    },
    assets: [],
    layers: [],
    createdAt: now,
    updatedAt: now,
  };
}
