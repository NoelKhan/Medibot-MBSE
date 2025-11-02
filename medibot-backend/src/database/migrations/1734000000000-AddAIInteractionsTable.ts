import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddAIInteractionsTable1734000000000 implements MigrationInterface {
  name = 'AddAIInteractionsTable1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_interactions table for conversational triage history
    await queryRunner.createTable(
      new Table({
        name: 'ai_interactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'userMessage',
            type: 'text',
          },
          {
            name: 'assistantResponse',
            type: 'text',
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '50',
            default: "'unknown'",
          },
          {
            name: 'confidence',
            type: 'float',
            default: 0.5,
          },
          {
            name: 'carePathway',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'needsEscalation',
            type: 'boolean',
            default: false,
          },
          {
            name: 'needsMoreInfo',
            type: 'boolean',
            default: false,
          },
          {
            name: 'escalationReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for efficient queries
    await queryRunner.createIndex(
      'ai_interactions',
      new TableIndex({
        name: 'IDX_ai_interactions_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'ai_interactions',
      new TableIndex({
        name: 'IDX_ai_interactions_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_interactions',
      new TableIndex({
        name: 'IDX_ai_interactions_createdAt',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('ai_interactions', 'IDX_ai_interactions_createdAt');
    await queryRunner.dropIndex('ai_interactions', 'IDX_ai_interactions_userId');
    await queryRunner.dropIndex('ai_interactions', 'IDX_ai_interactions_userId_createdAt');

    // Drop table
    await queryRunner.dropTable('ai_interactions');
  }
}
