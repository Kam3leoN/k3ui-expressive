/*
 * Custom pack entry (scripts/build-pack.mjs): the shared API with a catalog
 * reduced to the selected components — `init()` registers all of *them*.
 */
import { bootstrapGlobal } from './base.js';

export * from './base.js';

bootstrapGlobal();
