export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  appVersion: string;
  features: {
    enableAnalytics: boolean;
    enableDebugMode: boolean;
  };
}

export function validateEnvironment(env: Partial<Environment>): Environment {
  const errors: string[] = [];

  if (typeof env.production !== 'boolean') {
    errors.push('production must be a boolean');
  }

  if (!env.apiUrl || typeof env.apiUrl !== 'string') {
    errors.push('apiUrl is required and must be a string');
  } else if (!this.isValidUrl(env.apiUrl)) {
    errors.push('apiUrl must be a valid URL');
  }

  if (!env.appName || typeof env.appName !== 'string') {
    errors.push('appName is required and must be a string');
  }

  if (!env.appVersion || typeof env.appVersion !== 'string') {
    errors.push('appVersion is required and must be a string');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return {
    production: env.production ?? false,
    apiUrl: env.apiUrl!,
    appName: env.appName!,
    appVersion: env.appVersion!,
    features: {
      enableAnalytics: env.features?.enableAnalytics ?? false,
      enableDebugMode: env.features?.enableDebugMode ?? false,
    },
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getEnvironmentValidator<T extends Partial<Environment>>(schema: T): T {
  return validateEnvironment(schema) as T;
}