import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseOptimizations1730073700000 implements MigrationInterface {
  name = 'AddDatabaseOptimizations1730073700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add version column to reminders for optimistic locking
    await queryRunner.query(`
      ALTER TABLE "reminders" 
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1
    `);

    // Add version column to appointments for optimistic locking
    await queryRunner.query(`
      ALTER TABLE "appointments" 
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1
    `);

    // Add length constraint to reminder title (PostgreSQL doesn't enforce in ALTER, but good for documentation)
    await queryRunner.query(`
      COMMENT ON COLUMN "reminders"."title" IS 'Max length: 255 characters'
    `);

    // Create composite index for reminders (userId, status, reminderTime)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reminders_user_status_time" 
      ON "reminders" ("userId", "status", "reminderTime")
    `);

    // Create index for appointment lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reminders_appointmentId" 
      ON "reminders" ("appointmentId")
    `);

    // Create index for due reminders cron job
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reminders_status_time" 
      ON "reminders" ("status", "reminderTime")
    `);

    // Create individual index for userId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reminders_userId" 
      ON "reminders" ("userId")
    `);

    // Create index for reminder type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reminders_type" 
      ON "reminders" ("type")
    `);

    // Create index for reminderTime (critical for cron jobs)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reminders_reminderTime" 
      ON "reminders" ("reminderTime")
    `);

    // Create index for status
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reminders_status" 
      ON "reminders" ("status")
    `);

    // Create composite index for appointments (status, appointmentDate)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_appointments_status_date" 
      ON "appointments" ("status", "appointmentDate")
    `);

    // Add check constraints for data integrity
    await queryRunner.query(`
      ALTER TABLE "reminders" 
      ADD CONSTRAINT IF NOT EXISTS "CHK_reminders_title_length" 
      CHECK (char_length("title") <= 255)
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders" 
      ADD CONSTRAINT IF NOT EXISTS "CHK_reminders_recurring_pattern" 
      CHECK (
        "recurring" = false OR 
        ("recurringPattern" IS NOT NULL AND "recurringInterval" IS NOT NULL)
      )
    `);

    // Add foreign key constraints if not exist (with cascading deletes)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'FK_reminders_user'
        ) THEN
          ALTER TABLE "reminders" 
          ADD CONSTRAINT "FK_reminders_user" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'FK_appointments_user'
        ) THEN
          ALTER TABLE "appointments" 
          ADD CONSTRAINT "FK_appointments_user" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    console.log('Database optimizations applied successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraints
    await queryRunner.query(`
      ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "CHK_reminders_recurring_pattern"
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "CHK_reminders_title_length"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_status_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminders_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminders_reminderTime"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminders_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminders_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminders_status_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminders_appointmentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminders_user_status_time"`);

    // Drop version columns
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "reminders" DROP COLUMN IF EXISTS "version"`);

    console.log('Database optimizations reverted');
  }
}
