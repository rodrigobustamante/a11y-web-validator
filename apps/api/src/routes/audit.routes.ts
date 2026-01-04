import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { PdfController } from '../controllers/pdf.controller';

const router = Router();
const auditController = new AuditController();
const pdfController = new PdfController();

// POST /api/audit - Run accessibility audit
router.post('/', auditController.runAudit.bind(auditController));

// GET /api/audit/status - Service health check
router.get('/status', auditController.getStatus.bind(auditController));

// POST /api/audit/export-pdf - Export audit results to PDF
router.post('/export-pdf', pdfController.exportPdf.bind(pdfController));

export default router;
