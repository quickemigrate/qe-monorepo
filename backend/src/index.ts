import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './middleware/cors';
import contactRouter from './routes/contact';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(corsMiddleware);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/contact', contactRouter);

app.listen(PORT, () => {
  console.log(`Backend Quick Emigrate corriendo en http://localhost:${PORT}`);
});
