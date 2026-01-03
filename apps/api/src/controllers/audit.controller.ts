import { Request, Response, NextFunction } from 'express';
import { A11yAuditService } from '../services/a11y-audit.service';
import { urlSchema } from '../validators/audit.validator';
import { z } from 'zod';

const auditService = new A11yAuditService();

export class AuditController {
  /**
   * POST /api/audit
   * Run accessibility audit on a URL
   */
  async runAudit(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const { url } = urlSchema.parse(req.body);

      console.log(`🎯 Audit requested for: ${url}`);

      // Run the audit
      const result = await auditService.runAudit(url);

      console.log(
        `📊 Audit completed. Score: ${result.healthScore}/100, Issues: ${result.totalIssues}`
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }

      // Pass other errors to error handler middleware
      next(error);
    }
  }

  /**
   * GET /api/audit/status
   * Health check for audit service
   */
  async getStatus(req: Request, res: Response) {
    res.json({
      success: true,
      status: 'ready',
      message: 'A11y Audit Service is operational',
    });
  }
}

