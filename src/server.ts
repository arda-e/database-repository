import express from 'express';
import { createDatabase, DatabaseManager } from './database/DatabaseManager';
import { OrderService } from './OrderService';

const app = express();
const port = process.env.PORT || 3000;

let dbManager: DatabaseManager;
let orderService: OrderService;

async function initializeApp() {
  dbManager = new DatabaseManager();
  await createDatabase();
  orderService = new OrderService(dbManager);
  console.log('Database initialized successfully');
}

app.get('/orders/pending', async (req, res) => {
  try {
    const orders = await orderService.getPendingOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', database: 'connected' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (dbManager) {
    await dbManager.close();
  }
  process.exit(0);
});

async function startServer() {
  await initializeApp();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);