import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../firebase';

const router = Router();

router.get('/', verifyToken, async (_req, res) => {
  try {
    const [diagnosticosSnap, usuariosSnap, leadsSnap] = await Promise.all([
      db.collection('diagnosticos').get(),
      db.collection('usuarios').get(),
      db.collection('leads').get(),
    ]);

    const diagnosticos = diagnosticosSnap.docs.map(d => d.data());
    const completados = diagnosticos.filter(d => d.estado === 'completado');

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const esteMes = completados.filter(d =>
      new Date(d.completadoEn || d.creadoEn) >= inicioMes
    );

    const usuarios = usuariosSnap.docs.map(d => d.data());
    const porPlan = {
      starter: usuarios.filter(u => u.plan === 'starter').length,
      pro:     usuarios.filter(u => u.plan === 'pro').length,
      premium: usuarios.filter(u => u.plan === 'premium').length,
    };

    const leads = leadsSnap.docs.map(d => d.data());
    const leadsPendientes = leads.filter(l => l.estado === 'nuevo').length;

    const paisesDiag = completados.reduce((acc: Record<string, number>, d) => {
      const pais = d.pais || 'Desconocido';
      acc[pais] = (acc[pais] || 0) + 1;
      return acc;
    }, {});
    const topPaises = Object.entries(paisesDiag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pais, count]) => ({ pais, count }));

    const ultimosDiagnosticos = diagnosticosSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((d: any) => d.estado === 'completado')
      .sort((a: any, b: any) =>
        new Date(b.completadoEn || b.creadoEn).getTime() -
        new Date(a.completadoEn || a.creadoEn).getTime()
      )
      .slice(0, 5);

    const ultimosLeads = leadsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) =>
        new Date(b.creadoEn || b.createdAt || 0).getTime() -
        new Date(a.creadoEn || a.createdAt || 0).getTime()
      )
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        diagnosticos: {
          total: completados.length,
          esteMes: esteMes.length,
          ingresosTotales: completados.length * 59,
          ingresosMes: esteMes.length * 59,
        },
        usuarios: {
          total: usuarios.length,
          porPlan,
        },
        leads: {
          total: leads.length,
          pendientes: leadsPendientes,
        },
        topPaises,
        ultimosDiagnosticos,
        ultimosLeads,
      },
    });
  } catch (error) {
    console.error('Error métricas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener métricas' });
  }
});

export default router;
