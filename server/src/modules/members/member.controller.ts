import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as memberService from './member.service.js';

function requireMemberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function ownProfile(request: Request, response: Response) {
  const data = await memberService.getOwnProfile(requireMemberId(request));
  return response.status(200).json({ success: true, data });
}

export async function updateOwnProfile(request: Request, response: Response) {
  const data = await memberService.updateOwnProfile(requireMemberId(request), request.body);
  return response.status(200).json({ success: true, message: 'Profile updated.', data });
}

export async function membershipCard(request: Request, response: Response) {
  const data = await memberService.getMembershipCard(requireMemberId(request));
  return response.status(200).json({ success: true, data });
}

export async function list(request: Request, response: Response) {
  const data = await memberService.listMembers(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function get(request: Request, response: Response) {
  const data = await memberService.getMember(String(request.params.id));
  return response.status(200).json({ success: true, data });
}

export async function create(request: Request, response: Response) {
  const data = await memberService.createMember(request.body);
  return response.status(201).json({ success: true, message: 'Member created.', data });
}

export async function update(request: Request, response: Response) {
  const data = await memberService.updateMember(String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'Member updated.', data });
}
