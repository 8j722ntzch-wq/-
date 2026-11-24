// Only the production release workflow should opt in when the site is ready.
export const indexingEnabled = import.meta.env.SITE_INDEXABLE === 'true';
