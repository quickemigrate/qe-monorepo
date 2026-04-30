import * as admin from 'firebase-admin';

let dbKnowledge: FirebaseFirestore.Firestore | null = null;

try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_CONOCIMIENTO || '';
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_CONOCIMIENTO not set');
  const serviceAccount = JSON.parse(raw);
  const knowledgeApp = admin.initializeApp(
    { credential: admin.credential.cert(serviceAccount) },
    'knowledge'
  );
  dbKnowledge = knowledgeApp.firestore();
} catch (e) {
  console.error('firebaseKnowledge: init failed, RAG disabled:', e);
}

export { dbKnowledge };
