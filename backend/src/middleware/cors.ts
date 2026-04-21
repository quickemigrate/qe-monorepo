import cors from 'cors';

export const corsMiddleware = cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', /\.vercel\.app$/],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
