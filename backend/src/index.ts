import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRouter from './routes/contact';
import leadsRouter from './routes/leads';
import expedientesRouter from './routes/expedientes';
import clientRouter from './routes/client';
import articlesRouter from './routes/articles';
import diagnosticoRouter from './routes/diagnostico';
import conocimientoRouter from './routes/conocimiento';
import usuariosRouter from './routes/usuarios';
import chatRouter from './routes/chat';
import configRouter from './routes/config';
import metricasRouter from './routes/metricas';
import { db } from './firebase';

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
app.use('/api/conocimiento', conocimientoRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/chat', chatRouter);
app.use('/api/config', configRouter);
app.use('/api/metricas', metricasRouter);

async function initConfig() {
  const configRef = db.collection('config').doc('chat');
  const doc = await configRef.get();
  if (!doc.exists) {
    await configRef.set({ limiteMensajesPro: 50, limiteMensajesPremium: 200 });
    console.log('Config de chat inicializada');
  }
}

app.listen(PORT, () => {
  console.log(`Backend Quick Emigrate corriendo en http://localhost:${PORT}`);
  initConfig().catch(err => console.error('Error initConfig:', err));
});
