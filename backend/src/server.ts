import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './db';
import { config } from './config';
import authRoutes from './routes/auth';
import ticketRoutes from './routes/tickets';

async function main() {
  await connectDB();

  const app = express();
  app.use(cors({
  origin: ['http://localhost:4200'], // ton front
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());

  app.get('/', (_req, res) => res.send('BugFlow API'));
  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);

  app.listen(config.port, () => console.log(`🚀 API on http://localhost:${config.port}`));
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
