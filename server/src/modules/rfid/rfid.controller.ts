import type { Request, Response } from 'express';
import * as rfidService from './rfid.service.js';

export async function list(request: Request, response: Response) {
  const data = await rfidService.listRfid(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function update(request: Request, response: Response) {
  const data = await rfidService.updateRfid(String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'RFID record updated.', data });
}

export async function verify(request: Request, response: Response) {
  const data = await rfidService.verifyRfid(request.body.referenceNumber);
  return response.status(200).json({ success: true, data });
}
