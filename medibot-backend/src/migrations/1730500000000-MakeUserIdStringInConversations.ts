import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class MakeUserIdStringInConversations1730500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint first
    const table = await queryRunner.getTable('conversations');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('conversations', foreignKey);
    }

    // Change userId column from uuid to varchar to support anonymous users
    await queryRunner.changeColumn(
      'conversations',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        length: '255',
      }),
    );

    // Note: We don't recreate the foreign key to allow anonymous user IDs
    // The mobile app can still use UUIDs, web app can use anonymous strings
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Change userId back to uuid
    await queryRunner.changeColumn(
      'conversations',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
      }),
    );

    // Recreate foreign key
    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }
}
