import { SqliteAdapter } from '../adapters/SqliteAdapter';

describe('SqliteAdapter', () => {
  let adapter: SqliteAdapter;

  beforeEach(async () => {
    adapter = new SqliteAdapter({ filename: ':memory:' });
    await adapter.initialize();

    // Create test table
    await adapter.query(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL
      )
    `);

    // Insert test data
    await adapter.query(`
      INSERT INTO orders (status) VALUES ('pending'), ('completed'), ('pending')
    `);
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  it('should initialize successfully', async () => {
    expect(adapter).toBeDefined();
  });

  it('should execute SELECT queries', async () => {
    const result = await adapter.query('SELECT * FROM orders WHERE status = ?', ['pending']);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].status).toBe('pending');
  });

  it('should handle INSERT queries', async () => {
    const result = await adapter.query(
      'INSERT INTO orders (status) VALUES (?)',
      ['shipped']
    );
    expect(result).toBeDefined();
  });

  it('should handle empty result sets', async () => {
    const result = await adapter.query('SELECT * FROM orders WHERE status = ?', ['nonexistent']);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});