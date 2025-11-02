/**
 * TypeORM CLI Configuration
 * =========================
 * Separate config file for migrations to avoid conflicts
 */

import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'medibot',
  password: 'medibot_dev_password',
  database: 'medibot_dev',
  entities: ['src/database/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  synchronize: false,
  logging: true,
});
