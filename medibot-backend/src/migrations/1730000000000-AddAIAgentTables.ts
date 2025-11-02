import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddAIAgentTables1730000000000 implements MigrationInterface {
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
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'conversationId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'symptoms',
            type: 'jsonb',
          },
          {
            name: 'triage',
            type: 'jsonb',
          },
          {
            name: 'action',
            type: 'jsonb',
          },
          {
            name: 'patientSummary',
            type: 'text',
          },
          {
            name: 'clinicianSummary',
            type: 'text',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'active'",
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
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
          },
          {
            name: 'input',
            type: 'text',
          },
          {
            name: 'output',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processingTimeMs',
            type: 'int',
          },
          {
            name: 'model',
            type: 'varchar',
            default: "'medllama2'",
          },
          {
            name: 'status',
            type: 'varchar',
          },
          {
            name: 'errorMessage',
            type: 'text',
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
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'messages',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'active'",
          },
          {
            name: 'triageCaseId',
            type: 'uuid',
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
        columnNames: ['triageCaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'triage_cases',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX idx_triage_cases_user_id ON triage_cases(userId);
      CREATE INDEX idx_triage_cases_status ON triage_cases(status);
      CREATE INDEX idx_triage_cases_created_at ON triage_cases(createdAt);
      CREATE INDEX idx_triage_severity ON triage_cases USING GIN ((triage->'severity_level'));
      
      CREATE INDEX idx_ai_logs_user_id ON ai_logs(userId);
      CREATE INDEX idx_ai_logs_action ON ai_logs(action);
      CREATE INDEX idx_ai_logs_status ON ai_logs(status);
      CREATE INDEX idx_ai_logs_created_at ON ai_logs(createdAt);
      
      CREATE INDEX idx_conversations_user_id ON conversations(userId);
      CREATE INDEX idx_conversations_status ON conversations(status);
      CREATE INDEX idx_conversations_triage_case_id ON conversations(triageCaseId);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('conversations');
    await queryRunner.dropTable('ai_logs');
    await queryRunner.dropTable('triage_cases');
  }
}
