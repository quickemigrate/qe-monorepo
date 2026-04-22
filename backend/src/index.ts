import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRouter from './routes/contact';
import leadsRouter from './routes/leads';
import expedientesRouter from './routes/expedientes';
import clientRouter from './routes/client';
import articlesRouter from './routes/articles';
import diagnosticoRouter from './routes/diagnostico';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://quickemigrate.com',
  'https://www.quickemigrate.com',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Webhook de Stripe requiere body raw antes de express.json()
app.use('/api/diagnostico/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/contact', contactRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/expedientes', expedientesRouter);
app.use('/api/client', clientRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/diagnostico', diagnosticoRouter);

app.listen(PORT, () => {
  console.log(`Backend Quick Emigrate corriendo en http://localhost:${PORT}`);
});
