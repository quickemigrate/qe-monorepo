import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../firebase';

const router = Router();

// MAX_SCAN evita full-scan ilimitado: solo se analizan los últimos N completados
// para ingresos, top países y "este mes". Recientes ya cubre la actividad relevante.
const MAX_SCAN = 1000;

router.get('/', verifyToken, async (_req, res) => {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioMesIso = inicioMes.toISOString();

    const diagnosticosCol = db.collection('diagnosticos');
    const usuariosCol = db.collection('usuarios');
    const leadsCol = db.collection('leads');

    const [
      diagTotalAgg,
      usuariosTotalAgg,
      leadsTotalAgg,
      planStarterAgg,
      planProAgg,
      planPremiumAgg,
      leadsPendAgg,
      diagCompletadosSnap,
      diagEsteMesSnap,
      ultimosDiagnosticosSnap,
      ultimosLeadsSnap,
      configDoc,
    ] = await Promise.all([
      (diagnosticosCol as any).count().get(),
      (usuariosCol as any).count().get(),
      (leadsCol as any).count().get(),
      (usuariosCol.where('plan', '==', 'starter') as any).count().get(),
      (usuariosCol.where('plan', '==', 'pro') as any).count().get(),
      (usuariosCol.where('plan', '==', 'premium') as any).count().get(),
      (leadsCol.where('estado', '==', 'nuevo') as any).count().get(),
      diagnosticosCol
        .where('estado', '==', 'completado')
        .orderBy('completadoEn', 'desc')
        .limit(MAX_SCAN)
        .get(),
      diagnosticosCol
        .where('estado', '==', 'completado')
        .where('completadoEn', '>=', inicioMesIso)
        .limit(MAX_SCAN)
        .get(),
      diagnosticosCol
        .where('estado', '==', 'completado')
        .orderBy('completadoEn', 'desc')
        .limit(5)
        .get(),
      leadsCol.orderBy('createdAt', 'desc').limit(5).get(),
      db.collection('config').doc('planes').get(),
    ]);

    const configData = configDoc.data();
    const precioStarter: number = configData?.planes
      ?.find((p: any) => p.id === 'starter')?.precio ?? 59;

    const completados = diagCompletadosSnap.docs.map(d => d.data());
    const esteMes = diagEsteMesSnap.docs.map(d => d.data());

    const paisesDiag = completados.reduce((acc: Record<string, number>, d: any) => {
      const pais = d.pais || 'Desconocido';
      acc[pais] = (acc[pais] || 0) + 1;
      return acc;
    }, {});
    const topPaises = Object.entries(paisesDiag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pais, count]) => ({ pais, count }));

    res.json({
      success: true,
      data: {
        diagnosticos: {
          total: completados.length,
          esteMes: esteMes.length,
          ingresosTotales: completados.reduce((sum: number, d: any) => sum + (d.precio ?? precioStarter), 0),
          ingresosMes: esteMes.reduce((sum: number, d: any) => sum + (d.precio ?? precioStarter), 0),
        },
        usuarios: {
          total: usuariosTotalAgg.data().count,
          porPlan: {
            starter: planStarterAgg.data().count,
            pro: planProAgg.data().count,
            premium: planPremiumAgg.data().count,
          },
        },
        leads: {
          total: leadsTotalAgg.data().count,
          pendientes: leadsPendAgg.data().count,
        },
        topPaises,
        ultimosDiagnosticos: ultimosDiagnosticosSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        ultimosLeads: ultimosLeadsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        // Total reportado puede excluir docs sin completadoEn — solo usar diagnosticosCount como referencia
        diagnosticosCount: diagTotalAgg.data().count,
      },
    });
  } catch (error) {
    console.error('Error métricas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener métricas' });
  }
});

const PERIODOS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
const METRICAS_VALIDAS = new Set(['diagnosticos', 'leads', 'ingresos']);

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

router.get('/series', verifyToken, async (req, res) => {
  try {
    const metric = String(req.query.metric || 'diagnosticos');
    const period = String(req.query.period || '30d');
    if (!METRICAS_VALIDAS.has(metric)) return res.status(400).json({ error: 'Métrica inválida' });
    const days = PERIODOS[period];
    if (!days) return res.status(400).json({ error: 'Período inválido' });

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const startIso = start.toISOString();

    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets[dayKey(d.toISOString())] = 0;
    }

    if (metric === 'diagnosticos' || metric === 'ingresos') {
      const configDoc = await db.collection('config').doc('planes').get();
      const precioStarter: number = configDoc.data()?.planes?.find((p: any) => p.id === 'starter')?.precio ?? 59;

      const snap = await db.collection('diagnosticos')
        .where('estado', '==', 'completado')
        .where('completadoEn', '>=', startIso)
        .orderBy('completadoEn', 'asc')
        .limit(2000)
        .get();

      snap.docs.forEach(doc => {
        const data = doc.data();
        const key = dayKey(data.completadoEn);
        if (key in buckets) {
          buckets[key] += metric === 'ingresos' ? (data.precio ?? precioStarter) : 1;
        }
      });
    } else if (metric === 'leads') {
      const snap = await db.collection('leads')
        .where('createdAt', '>=', startIso)
        .orderBy('createdAt', 'asc')
        .limit(2000)
        .get();

      snap.docs.forEach(doc => {
        const key = dayKey(doc.data().createdAt);
        if (key in buckets) buckets[key] += 1;
      });
    }

    const series = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    res.json({ success: true, data: { metric, period, series } });
  } catch (error) {
    console.error('Error series:', error);
    res.status(500).json({ success: false, error: 'Error al obtener series' });
  }
});

export default router;
