import { Request, Response, NextFunction } from 'express';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { auditResultSchema } from '../validators/pdf.validator';
import { z } from 'zod';

const pdfService = new PdfGeneratorService();

export class PdfController {
  /**
   * POST /api/audit/export-pdf
   * Generate and download PDF report from audit results
   */
  async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const auditResult = auditResultSchema.parse(req.body);

      console.log(`📄 Generating PDF for: ${auditResult.url}`);

      // Generate PDF
      const pdfBuffer = await pdfService.generatePdf(auditResult);

      // Create filename from URL
      const urlHostname = new URL(auditResult.url).hostname
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '');
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
      // Handle validation errors
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }

      console.error('❌ PDF generation failed:', error);
      next(error);
    }
  }
}
