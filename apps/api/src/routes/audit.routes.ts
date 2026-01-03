import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';

const router = Router();
const auditController = new AuditController();

// POST /api/audit - Run accessibility audit
router.post('/', auditController.runAudit.bind(auditController));

// GET /api/audit/status - Service health check
router.get('/status', auditController.getStatus.bind(auditController));

export default router;

