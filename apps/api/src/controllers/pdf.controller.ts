import { Request, Response, NextFunction } from 'express';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import type { A11yAuditResult } from '@a11y-web-validator/types';

const pdfService = new PdfGeneratorService();

export class PdfController {
  /**
   * POST /api/audit/export-pdf
   * Generate and download PDF report from audit results
   */
  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const auditResult: A11yAuditResult = req.body;

      if (!auditResult || !auditResult.url) {
        return res.status(400).json({
          success: false,
          error: 'Invalid audit result data',
        });
      }

      console.log(`📄 Generating PDF for: ${auditResult.url}`);

      // Generate PDF
      const pdfBuffer = await pdfService.generatePdf(auditResult);

      // Create filename from URL
      const urlHostname = new URL(auditResult.url).hostname;
      const timestamp = new Date(auditResult.timestamp)
        .toISOString()
        .split('T')[0];
      const filename = `a11y-report-${urlHostname}-${timestamp}.pdf`;

      console.log(`✅ PDF generated: ${filename}`);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      next(error);
    }
  }
}
