import type { Request, Response } from 'express';
import * as qrService from './qr.service.js';

export async function verify(request: Request, response: Response) {
  const data = await qrService.verifyQr(request.body.token, request.body.checkIn);
  return response.status(200).json({ success: true, data });
}
