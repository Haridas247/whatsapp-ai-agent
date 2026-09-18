import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { webhookController } from './controllers/webhook.controller';
import { apiController } from './controllers/api.controller';
import { authController } from './controllers/auth.controller';
import './services/reminder.worker'; // Initialize BullMQ reminder worker

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'whatsapp-ai-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Meta WhatsApp Cloud Webhooks (supporting both /api/webhooks and /webhooks paths)
app.get(['/api/webhooks/whatsapp', '/webhooks/whatsapp'], (req, res) => {
  webhookController.verify(req, res);
});

app.post(['/api/webhooks/whatsapp', '/webhooks/whatsapp'], async (req, res) => {
  await webhookController.handleInbound(req, res);
});

// Auth API Routes
app.post('/api/auth/signup', (req, res) => authController.signup(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));
app.post('/api/auth/change-password', (req, res) => authController.changePassword(req, res));

// Admin REST API Routes
app.get('/api/dashboard/stats', (req, res) => apiController.getDashboardStats(req, res));
app.get('/api/appointments', (req, res) => apiController.getAppointments(req, res));
app.patch('/api/appointments/:id/status', (req, res) => apiController.updateAppointmentStatus(req, res));
app.get('/api/conversations', (req, res) => apiController.getConversations(req, res));
app.delete('/api/conversations', (req, res) => apiController.clearAllConversations(req, res));
app.get('/api/conversations/:id/messages', (req, res) => apiController.getConversationMessages(req, res));
app.post('/api/conversations/:id/messages', (req, res) => apiController.sendAgentMessage(req, res));
app.post('/api/conversations/:id/takeover', (req, res) => apiController.toggleHandoff(req, res));
app.delete('/api/conversations/:id', (req, res) => apiController.deleteConversation(req, res));
app.get('/api/knowledge', (req, res) => apiController.getKnowledge(req, res));
app.post('/api/knowledge', (req, res) => apiController.createKnowledgeDocument(req, res));
app.post('/api/knowledge/upload-pdf', (req, res) => apiController.uploadPdfKnowledge(req, res));
app.post('/api/knowledge/:id/reindex', (req, res) => apiController.reindexKnowledgeDocument(req, res));
app.delete('/api/knowledge/:id', (req, res) => apiController.deleteKnowledgeDocument(req, res));
app.get('/api/services', (req, res) => apiController.getServices(req, res));
app.post('/api/services', (req, res) => apiController.createOrUpdateService(req, res));
app.get('/api/business', (req, res) => apiController.getBusinessProfile(req, res));
app.get('/api/businesses', (req, res) => apiController.getBusinesses(req, res));
app.post('/api/business/switch-active', (req, res) => apiController.switchActiveBusiness(req, res));
app.post('/api/simulator/inbound', (req, res) => apiController.simulateInbound(req, res));

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
const PORT = config.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp AI SaaS Backend running on http://localhost:${PORT}`);
  console.log(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/api/webhooks/whatsapp`);
});
