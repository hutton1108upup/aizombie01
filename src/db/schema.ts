import * as authSchema from './auth.schema';
import * as appSchema from './app.schema';
import * as videoSchema from './video.schema';

/**
 * Re-export all tables so drizzle-kit can discover them when reading this file.
 * https://orm.drizzle.team/docs/drizzle-kit-generate
 */
export * from './auth.schema';
export * from './app.schema';
export * from './video.schema';

export const schema = {
  ...authSchema,
  ...appSchema,
  ...videoSchema,
} as const;
