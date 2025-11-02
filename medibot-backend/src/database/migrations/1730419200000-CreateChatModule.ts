import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateChatModule1730419200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
            type: 'varchar',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'archived', 'closed'],
            default: "'active'",
          },
          {
            name: 'lastMessageAt',
            type: 'timestamp',
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

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
          },
          {
            name: 'sender',
            type: 'enum',
            enum: ['user', 'ai', 'staff'],
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'messageType',
            type: 'enum',
            enum: ['text', 'image', 'audio'],
            default: "'text'",
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

    // Create symptom_analyses table
    await queryRunner.createTable(
      new Table({
        name: 'symptom_analyses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'messageId',
            type: 'uuid',
          },
          {
            name: 'symptoms',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['low', 'moderate', 'high', 'emergency'],
            default: "'low'",
          },
          {
            name: 'bodyParts',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'duration',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'triggers',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'sentiment',
            type: 'enum',
            enum: ['concerned', 'anxious', 'calm', 'urgent'],
            default: "'calm'",
          },
          {
            name: 'medicalTerms',
            type: 'text',
            isArray: true,
            default: "'{}'",
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

    // Add foreign keys
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
      'messages',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'symptom_analyses',
      new TableForeignKey({
        columnNames: ['messageId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'messages',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for performance
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_userId_status',
        columnNames: ['userId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_lastMessageAt',
        columnNames: ['lastMessageAt'],
      }),
    );

    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_conversations_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_conversationId',
        columnNames: ['conversationId'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_conversationId_createdAt',
        columnNames: ['conversationId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_sender',
        columnNames: ['sender'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'symptom_analyses',
      new TableIndex({
        name: 'IDX_symptom_analyses_messageId',
        columnNames: ['messageId'],
      }),
    );

    await queryRunner.createIndex(
      'symptom_analyses',
      new TableIndex({
        name: 'IDX_symptom_analyses_severity',
        columnNames: ['severity'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const conversationsTable = await queryRunner.getTable('conversations');
    const conversationsForeignKey = conversationsTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (conversationsForeignKey) {
      await queryRunner.dropForeignKey('conversations', conversationsForeignKey);
    }

    const messagesTable = await queryRunner.getTable('messages');
    const messagesForeignKey = messagesTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('conversationId') !== -1,
    );
    if (messagesForeignKey) {
      await queryRunner.dropForeignKey('messages', messagesForeignKey);
    }

    const symptomAnalysesTable = await queryRunner.getTable('symptom_analyses');
    const symptomAnalysesForeignKey = symptomAnalysesTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('messageId') !== -1,
    );
    if (symptomAnalysesForeignKey) {
      await queryRunner.dropForeignKey('symptom_analyses', symptomAnalysesForeignKey);
    }

    // Drop tables
    await queryRunner.dropTable('symptom_analyses');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('conversations');
  }
}
