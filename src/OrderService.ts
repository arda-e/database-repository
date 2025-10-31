import { TransactionManager, Transactional } from './transactions/';

export class OrderService {
    public transactionManager: TransactionManager

  constructor(private dbManager: any) {
      this.transactionManager = new TransactionManager(dbManager);
  }

  // Example 1: Manual transaction (the hard way)
  async createOrderManual(orderData: any) {
    const trx = await this.dbManager.beginTransaction();
    try {
      // Create order
      await this.dbManager.query(
        'INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)',
        [orderData.customerId, orderData.total, 'pending']
      );

      // Create order items
      for (const item of orderData.items) {
        await this.dbManager.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          ['LAST_INSERT_ID()', item.productId, item.quantity, item.price]
        );
      }

      // Update customer stats
      await this.dbManager.query(
        'UPDATE customers SET orders_count = orders_count + 1 WHERE id = ?',
        [orderData.customerId]
      );

      await trx.commit();
      return { success: true };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Example 2: Using TransactionManager (better)
  async createOrderWithManager(orderData: any) {
    return this.transactionManager.runInTransaction(async () => {
      // Create order
      const result = await this.dbManager.query(
        'INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)',
        [orderData.customerId, orderData.total, 'pending']
      );

      // Create order items
      for (const item of orderData.items) {
        await this.dbManager.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [result.insertId, item.productId, item.quantity, item.price]
        );
      }

      // Update customer stats
      await this.dbManager.query(
        'UPDATE customers SET orders_count = orders_count + 1 WHERE id = ?',
        [orderData.customerId]
      );

      return { success: true, orderId: result.insertId };
    });
  }

  // Example 3: Using @SimpleTransactional decorator (best!)
  @Transactional()
  async createOrder(orderData: any) {
    // Create order
    const result = await this.dbManager.query(
      'INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)',
      [orderData.customerId, orderData.total, 'pending']
    );

    // Create order items
    for (const item of orderData.items) {
      await this.dbManager.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [result.insertId, item.productId, item.quantity, item.price]
      );
    }

    // Update customer stats
    await this.dbManager.query(
      'UPDATE customers SET orders_count = orders_count + 1 WHERE id = ?',
      [orderData.customerId]
    );

    return { success: true, orderId: result.insertId };
  }

  // Another example: Getting current transaction info
  @Transactional()
  async getOrderStatus(orderId: string) {
    const tx = this.transactionManager.getCurrentTransaction();
    
    // In a real app, you might check if we're in a transaction
    // or use the transaction for specific queries
    console.log('Current transaction:', tx ? 'ACTIVE' : 'NONE');

    const result = await this.dbManager.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    return result[0];
  }

async getAllOrders() {
    return await this.dbManager.query('SELECT * FROM orders ORDER BY created_at DESC');
}

    async getPendingOrders() {
        return await this.dbManager.query('SELECT * FROM orders WHERE status = ?', ['pending']);
    }
}

