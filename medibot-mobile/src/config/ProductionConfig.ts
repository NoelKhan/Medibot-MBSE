/**
 * MVC ARCHITECTURE - CONFIGURATION LAYER (INFRASTRUCTURE)
 * =======================================================
 * Centralized configuration management for production deployment
 * 
 * PRODUCTION FEATURES:
 * ===================
 * 1. Environment-based configuration (dev/staging/prod)
 * 2. Secure credential management
 * 3. Feature flags for A/B testing and gradual rollouts
 * 4. Runtime configuration updates
 * 5. Container-friendly environment variable support
 * 6. Health check endpoints configuration
 */

export interface APIConfiguration {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  apiKey?: string;
  version: string;
}

export interface LLMConfiguration {
  provider: 'openai' | 'anthropic' | 'azure' | 'custom';
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
  timeout: number;
}

export interface DatabaseConfiguration {
  type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb';
  connectionString?: string;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl: boolean;
  poolSize: number;
}

export interface CacheConfiguration {
  provider: 'memory' | 'redis' | 'memcached';
  host?: string;
  port?: number;
  ttl: number; // Time to live in seconds
  maxSize?: number;
}

export interface SecurityConfiguration {
  jwtSecret: string;
  jwtExpiry: string;
  encryptionKey: string;
  bcryptRounds: number;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
  };
}

export interface MonitoringConfiguration {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  metricsEndpoint?: string;
  tracingEndpoint?: string;
  healthCheckPath: string;
}

export interface FeatureFlags {
  enableAIConsultation: boolean;
  enableVideoConsultation: boolean;
  enablePharmacyIntegration: boolean;
  enableEmergencyServices: boolean;
  enableNotifications: boolean;
  enableOfflineMode: boolean;
  enableAnalytics: boolean;
  enableBetaFeatures: boolean;
}

export interface ExternalIntegrations {
  healthcare: {
    fhir: {
      enabled: boolean;
      baseURL?: string;
      apiKey?: string;
    };
    epic: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
    };
  };
  communication: {
    twilio: {
      enabled: boolean;
      accountSid?: string;
      authToken?: string;
    };
    sendgrid: {
      enabled: boolean;
      apiKey?: string;
    };
  };
  payment: {
    stripe: {
      enabled: boolean;
      publicKey?: string;
      secretKey?: string;
    };
  };
}

export interface AppConfiguration {
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
  api: APIConfiguration;
  llm: LLMConfiguration;
  database: DatabaseConfiguration;
  cache: CacheConfiguration;
  security: SecurityConfiguration;
  monitoring: MonitoringConfiguration;
  features: FeatureFlags;
  integrations: ExternalIntegrations;
}

/**
 * PRODUCTION CONFIGURATION MANAGER
 * ================================
 * Manages environment-based configuration with secure credential handling
 */
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfiguration;
  private readonly defaultConfig: AppConfiguration;

  private constructor() {
    this.defaultConfig = this.getDefaultConfiguration();
    this.config = this.loadConfiguration();
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get configuration value with type safety
   */
  get<K extends keyof AppConfiguration>(key: K): AppConfiguration[K] {
    return this.config[key];
  }

  /**
   * Get nested configuration value safely
   */
  getNestedValue(path: string): any {
    return path.split('.').reduce((obj: any, key) => obj?.[key], this.config as any);
  }

  /**
   * Update configuration at runtime (for feature flags, etc.)
   */
  updateConfig<K extends keyof AppConfiguration>(
    key: K, 
    value: Partial<AppConfiguration[K]>
  ): void {
    this.config[key] = { 
      ...(this.config[key] as object), 
      ...(value as object) 
    } as AppConfiguration[K];
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature] ?? false;
  }

  /**
   * Get API configuration for specific service
   */
  getAPIConfig(service?: string): APIConfiguration {
    return this.config.api;
  }

  /**
   * Get LLM configuration with fallbacks
   */
  getLLMConfig(): LLMConfiguration {
    return this.config.llm;
  }

  /**
   * Validate configuration on startup
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields based on environment
    if (this.config.environment === 'production') {
      if (!this.config.security.jwtSecret) {
        errors.push('JWT secret is required in production');
      }
      if (!this.config.security.encryptionKey) {
        errors.push('Encryption key is required in production');
      }
      if (this.config.llm.provider !== 'custom' && !this.config.llm.apiKey) {
        errors.push('LLM API key is required for external providers');
      }
    }

    // Validate network configurations
    if (this.config.api.timeout < 1000) {
      errors.push('API timeout should be at least 1000ms');
    }

    if (this.config.cache.ttl < 60) {
      errors.push('Cache TTL should be at least 60 seconds');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get health check configuration
   */
  getHealthCheckConfig(): { enabled: boolean; path: string; checks: string[] } {
    return {
      enabled: this.config.monitoring.enableMetrics,
      path: this.config.monitoring.healthCheckPath,
      checks: [
        'database',
        'cache',
        'external_apis',
        'llm_service',
        'storage',
      ],
    };
  }

  private loadConfiguration(): AppConfiguration {
    const environment = this.getEnvironment();
    
    // Load base configuration
    let config = { ...this.defaultConfig };
    config.environment = environment;

    // Override with environment-specific values
    config = this.mergeEnvironmentConfig(config, environment);

    // Override with environment variables
    config = this.mergeEnvironmentVariables(config);

    return config;
  }

  private getDefaultConfiguration(): AppConfiguration {
    return {
      environment: 'development',
      version: '1.0.0',
      buildNumber: '1',
      api: {
        baseURL: 'https://api.medibot.health',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        version: 'v1',
      },
      llm: {
        provider: 'custom',
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
      },
      database: {
        type: 'sqlite',
        database: 'medibot.db',
        ssl: false,
        poolSize: 10,
      },
      cache: {
        provider: 'memory',
        ttl: 3600, // 1 hour
        maxSize: 100,
      },
      security: {
        jwtSecret: 'development-jwt-secret',
        jwtExpiry: '24h',
        encryptionKey: 'development-encryption-key',
        bcryptRounds: 12,
        rateLimiting: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100,
        },
        cors: {
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        },
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: false,
        enableLogging: true,
        logLevel: 'info',
        healthCheckPath: '/health',
      },
      features: {
        enableAIConsultation: true,
        enableVideoConsultation: true,
        enablePharmacyIntegration: true,
        enableEmergencyServices: true,
        enableNotifications: true,
        enableOfflineMode: true,
        enableAnalytics: false,
        enableBetaFeatures: false,
      },
      integrations: {
        healthcare: {
          fhir: { enabled: false },
          epic: { enabled: false },
        },
        communication: {
          twilio: { enabled: false },
          sendgrid: { enabled: false },
        },
        payment: {
          stripe: { enabled: false },
        },
      },
    };
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    const env = process.env.NODE_ENV || process.env.EXPO_PUBLIC_ENVIRONMENT;
    if (env === 'production' || env === 'staging') {
      return env as 'production' | 'staging';
    }
    return 'development';
  }

  private mergeEnvironmentConfig(
    config: AppConfiguration, 
    environment: string
  ): AppConfiguration {
    // Environment-specific overrides
    const envConfigs = {
      staging: {
        api: {
          baseURL: 'https://staging-api.medibot.health',
        },
        monitoring: {
          enableTracing: true,
          logLevel: 'debug' as const,
        },
        features: {
          enableBetaFeatures: true,
        },
      },
      production: {
        api: {
          baseURL: 'https://api.medibot.health',
          retryAttempts: 5,
        },
        database: {
          type: 'postgres' as const,
          ssl: true,
          poolSize: 20,
        },
        cache: {
          provider: 'redis' as const,
          ttl: 7200, // 2 hours
        },
        monitoring: {
          enableTracing: true,
          enableMetrics: true,
          logLevel: 'warn' as const,
        },
        security: {
          rateLimiting: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 50, // More restrictive in prod
          },
          cors: {
            origins: ['https://medibot.health', 'https://app.medibot.health'],
          },
        },
        features: {
          enableAnalytics: true,
          enableBetaFeatures: false,
        },
      },
    };

    const envConfig = envConfigs[environment as keyof typeof envConfigs];
    if (envConfig) {
      return this.deepMerge(config, envConfig);
    }

    return config;
  }

  private mergeEnvironmentVariables(config: AppConfiguration): AppConfiguration {
    // Map environment variables to configuration
    const envMappings = {
      'MEDIBOT_API_URL': 'api.baseURL',
      'MEDIBOT_API_KEY': 'api.apiKey',
      'MEDIBOT_LLM_PROVIDER': 'llm.provider',
      'MEDIBOT_LLM_API_KEY': 'llm.apiKey',
      'MEDIBOT_LLM_MODEL': 'llm.model',
      'MEDIBOT_DATABASE_URL': 'database.connectionString',
      'MEDIBOT_REDIS_URL': 'cache.host',
      'MEDIBOT_JWT_SECRET': 'security.jwtSecret',
      'MEDIBOT_ENCRYPTION_KEY': 'security.encryptionKey',
      'MEDIBOT_LOG_LEVEL': 'monitoring.logLevel',
    };

    const updatedConfig = { ...config };

    for (const [envVar, configPath] of Object.entries(envMappings)) {
      const envValue = process.env[envVar];
      if (envValue) {
        this.setNestedValue(updatedConfig, configPath, envValue);
      }
    }

    return updatedConfig;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[lastKey] = value;
  }
}

// Export singleton instance and types
export const config = ConfigurationManager.getInstance();
export default ConfigurationManager;