export function productionConfigErrors(config: {
  baseUrl?: string;
  authEnabled?: boolean;
  secret?: string;
  googleEnabled?: boolean;
  googleId?: string;
  googleSecret?: string;
}) {
  const errors: string[] = [];
  try {
    const url = new URL(config.baseUrl ?? '');
    if (
      url.protocol !== 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    ) {
      errors.push('Set VITE_BASE_URL to the production HTTPS origin.');
    }
    if (
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      errors.push(
        'VITE_BASE_URL must be an origin without a path or credentials.'
      );
    }
  } catch {
    errors.push('Set a valid VITE_BASE_URL.');
  }
  if (
    config.authEnabled !== false &&
    (!config.secret ||
      config.secret.length < 32 ||
      /better-auth-secret|local-preview|e2e-|example|placeholder/i.test(
        config.secret
      ))
  ) {
    errors.push('Set a unique BETTER_AUTH_SECRET with at least 32 characters.');
  }
  if (config.googleEnabled && (!config.googleId || !config.googleSecret)) {
    errors.push('Google login requires both OAuth credentials.');
  }
  return errors;
}
