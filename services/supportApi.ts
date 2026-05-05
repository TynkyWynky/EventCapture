import { apiPostJson } from '@/services/backendApi';

export interface SupportContactPayload {
  subject: string;
  message: string;
  email?: string;
}

export interface SupportContactResponse {
  id: string;
  message: string;
}

export async function submitSupportContact(payload: SupportContactPayload): Promise<SupportContactResponse> {
  return apiPostJson<SupportContactResponse>('/api/support/contact', payload);
}
