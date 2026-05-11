import { apiPostJson } from '@/services/backendApi';

export interface SupportContactPayload {
  subject: string;
  message: string;
  email?: string;
}

export interface SupportContactResponse {
  id: string;
  subject: string;
  message: string;
  email: string;
  status: string;
  priority: string;
  created_at: string;
  notification_status?: string | null;
}

export async function submitSupportContact(payload: SupportContactPayload): Promise<SupportContactResponse> {
  return apiPostJson<SupportContactResponse>('/api/support/contact', payload);
}
