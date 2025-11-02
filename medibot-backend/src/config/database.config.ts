/**
 * Database Configuration for MediBot Backend
 * ==========================================
 * Configures PostgreSQL connection with TypeORM
 * Supports multiple environments (dev, test, production)
 */

import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'medibot',
    password: process.env.DB_PASSWORD || 'medibot_dev_password',
    database: process.env.DB_DATABASE || 'medibot_dev',
    entities: [__dirname + '/../database/entities/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true', // Only true in development!
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
    
    // Connection pool settings (optimized for prototype)
    extra: {
      max: 10, // Maximum connections
      min: 2,  // Minimum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },

    // Auto-load entities and migrations
    autoLoadEntities: true,
  }),
);

// DataSource for TypeORM CLI (migrations) - MUST be default export only
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'medibot',
  password: process.env.DB_PASSWORD || 'medibot_dev_password',
  database: process.env.DB_DATABASE || 'medibot_dev',
  entities: [__dirname + '/../database/entities/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: true,
} as DataSourceOptions);

export default AppDataSource;
