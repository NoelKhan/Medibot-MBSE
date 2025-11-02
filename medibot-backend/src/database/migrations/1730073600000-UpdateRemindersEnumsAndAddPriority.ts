import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateRemindersEnumsAndAddPriority1730073600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new priority column
    await queryRunner.addColumn(
      'reminders',
      new TableColumn({
        name: 'priority',
        type: 'enum',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: "'medium'",
      }),
    );

    // Step 2: Update type enum to include 'test' and 'general', remove 'custom'
    // First, update existing 'custom' values to 'general'
    await queryRunner.query(`
      UPDATE reminders 
      SET type = 'general' 
      WHERE type = 'custom'
    `);

    // Drop and recreate the type enum with new values
    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN type TYPE VARCHAR(50)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "reminders_type_enum" CASCADE
    `);

    await queryRunner.query(`
      CREATE TYPE "reminders_type_enum" AS ENUM ('appointment', 'medication', 'followup', 'test', 'general')
    `);

    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN type TYPE "reminders_type_enum" 
      USING type::text::"reminders_type_enum"
    `);

    // Step 3: Update status enum - rename values
    // Map old values to new values:
    // 'scheduled' -> 'pending'
    // 'cancelled' -> 'dismissed'
    // 'failed' -> 'dismissed'
    // 'sent' stays 'sent'

    await queryRunner.query(`
      UPDATE reminders 
      SET status = CASE 
        WHEN status = 'scheduled' THEN 'pending'
        WHEN status = 'cancelled' THEN 'dismissed'
        WHEN status = 'failed' THEN 'dismissed'
        ELSE status
      END
    `);

    // Drop and recreate the status enum with new values
    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN status TYPE VARCHAR(50)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "reminders_status_enum" CASCADE
    `);

    await queryRunner.query(`
      CREATE TYPE "reminders_status_enum" AS ENUM ('pending', 'sent', 'dismissed', 'completed')
    `);

    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN status TYPE "reminders_status_enum" 
      USING status::text::"reminders_status_enum"
    `);

    // Update default value for status
    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN status SET DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Remove priority column
    await queryRunner.dropColumn('reminders', 'priority');

    // Step 2: Revert type enum
    await queryRunner.query(`
      UPDATE reminders 
      SET type = 'custom' 
      WHERE type = 'general'
    `);

    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN type TYPE VARCHAR(50)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "reminders_type_enum" CASCADE
    `);

    await queryRunner.query(`
      CREATE TYPE "reminders_type_enum" AS ENUM ('appointment', 'medication', 'followup', 'custom')
    `);

    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN type TYPE "reminders_type_enum" 
      USING type::text::"reminders_type_enum"
    `);

    // Step 3: Revert status enum
    await queryRunner.query(`
      UPDATE reminders 
      SET status = CASE 
        WHEN status = 'pending' THEN 'scheduled'
        WHEN status = 'dismissed' THEN 'cancelled'
        ELSE status
      END
    `);

    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN status TYPE VARCHAR(50)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "reminders_status_enum" CASCADE
    `);

    await queryRunner.query(`
      CREATE TYPE "reminders_status_enum" AS ENUM ('scheduled', 'sent', 'cancelled', 'failed')
    `);

    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN status TYPE "reminders_status_enum" 
      USING status::text::"reminders_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE reminders 
      ALTER COLUMN status SET DEFAULT 'scheduled'
    `);
  }
}
