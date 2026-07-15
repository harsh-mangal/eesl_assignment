import type { Request, Response } from 'express';
import * as service from './report.service.js';

export async function getReport(request: Request, response: Response) {
  const data = await service.getAdminReport(
    request.params.reportType as service.ReportType,
    request.query as service.ReportQuery,
  );
  return response.status(200).json({ success: true, data });
}
