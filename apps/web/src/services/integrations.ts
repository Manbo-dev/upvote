import api from './api';

// ── Types ───────────────────────────────────────────────────────────────────

export interface IntegrationResponse {
  id: string;
  provider: 'JIRA' | 'CLICKUP';
  siteUrl: string;
  createdAt: string;
}

export interface ExternalIssueResponse {
  id: string;
  provider: 'JIRA' | 'CLICKUP';
  externalId: string;
  externalUrl: string;
  externalStatus: string;
}

export interface ProjectOption {
  key?: string;  // Jira project key
  name: string;
  id: string;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ── Integrations CRUD ───────────────────────────────────────────────────────

export async function getIntegrations(): Promise<IntegrationResponse[]> {
  const { data } = await api.get<ApiResult<IntegrationResponse[]>>('/integrations');
  return data.data;
}

export async function getJiraAuthorizationUrl(): Promise<string> {
  const { data } = await api.get<ApiResult<{ authorizationUrl: string }>>('/integrations/jira/authorize');
  return data.data.authorizationUrl;
}

export async function getClickUpAuthorizationUrl(): Promise<string> {
  const { data } = await api.get<ApiResult<{ authorizationUrl: string }>>('/integrations/clickup/authorize');
  return data.data.authorizationUrl;
}

export async function disconnectIntegration(integrationId: string): Promise<void> {
  await api.delete(`/integrations/${integrationId}`);
}

// ── Projects / Lists ────────────────────────────────────────────────────────

export async function listProjects(integrationId: string): Promise<ProjectOption[]> {
  const { data } = await api.get<ApiResult<ProjectOption[]>>(`/integrations/${integrationId}/projects`);
  return data.data;
}

// ── Push to external ────────────────────────────────────────────────────────

export async function pushToExternal(
  feedbackGroupId: string,
  params: {
    integrationId: string;
    projectKey?: string;
    issueType?: string;
    listId?: string;
  },
): Promise<ExternalIssueResponse> {
  const { data } = await api.post<ApiResult<ExternalIssueResponse>>(
    `/integrations/push/${feedbackGroupId}`,
    params,
  );
  return data.data;
}

// ── External issues ─────────────────────────────────────────────────────────

export async function getExternalIssues(feedbackGroupId: string): Promise<ExternalIssueResponse[]> {
  const { data } = await api.get<ApiResult<ExternalIssueResponse[]>>(
    `/integrations/external-issues/${feedbackGroupId}`,
  );
  return data.data;
}

export async function unlinkExternalIssue(externalIssueId: string): Promise<void> {
  await api.delete(`/integrations/external-issues/${externalIssueId}`);
}
