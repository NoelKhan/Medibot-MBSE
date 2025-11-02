import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddAIAgentTables1730500000000 implements MigrationInterface {
  name = 'AddAIAgentTables1730500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create triage_cases table
    await queryRunner.createTable(
      new Table({
        name: 'triage_cases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'conversationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'initialMessage',
            type: 'text',
          },
          {
            name: 'symptoms',
            type: 'jsonb',
          },
          {
            name: 'severityLevel',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'urgencyScore',
            type: 'integer',
          },
          {
            name: 'redFlags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'recommendation',
            type: 'text',
          },
          {
            name: 'actionPlan',
            type: 'jsonb',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'open'",
          },
          {
            name: 'aiModel',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'confidence',
            type: 'decimal',
            precision: 5,
            scale: 2,
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
          },
        ],
      }),
      true,
    );

    // Create ai_logs table
    await queryRunner.createTable(
      new Table({
        name: 'ai_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'caseId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'input',
            type: 'jsonb',
          },
          {
            name: 'output',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'model',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'latencyMs',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'success',
            type: 'boolean',
            default: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'caseId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'messages',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'context',
            type: 'jsonb',
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
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'triage_cases',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ai_logs',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ai_logs',
      new TableForeignKey({
        columnNames: ['caseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'triage_cases',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['caseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'triage_cases',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'triage_cases',
      new TableIndex({
        name: 'IDX_triage_cases_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'triage_cases',
      new TableIndex({
        name: 'IDX_triage_cases_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'triage_cases',
      new TableIndex({
        name: 'IDX_triage_cases_severityLevel',
        columnNames: ['severityLevel'],
      }),
    );

    await queryRunner.createIndex(
      'ai_logs',
      new TableIndex({
        name: 'IDX_ai_logs_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_logs',
      new TableIndex({
        name: 'IDX_ai_logs_caseId',
        columnNames: ['caseId'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('conversations');
    await queryRunner.dropTable('ai_logs');
    await queryRunner.dropTable('triage_cases');
  }
}
