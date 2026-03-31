import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  getIntegrations,
  listProjects,
  listIssueTypes,
  pushToExternal,
  type IntegrationResponse,
} from '../services/integrations';

interface PushToExternalModalProps {
  isOpen: boolean;
  feedbackGroupId: string;
  feedbackGroupTitle: string;
  onClose: () => void;
}

export default function PushToExternalModal({
  isOpen,
  feedbackGroupId,
  feedbackGroupTitle,
  onClose,
}: PushToExternalModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationResponse | null>(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [issueType, setIssueType] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: integrations = [], isLoading: loadingIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: getIntegrations,
    enabled: isOpen,
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['integration-projects', selectedIntegration?.id],
    queryFn: () => listProjects(selectedIntegration!.id),
    enabled: !!selectedIntegration,
  });

  const { data: issueTypes = [], isLoading: loadingIssueTypes } = useQuery({
    queryKey: ['integration-issue-types', selectedIntegration?.id, selectedProject],
    queryFn: () => listIssueTypes(selectedIntegration!.id, selectedProject),
    enabled: !!selectedIntegration && selectedIntegration.provider === 'JIRA' && !!selectedProject,
  });

  useEffect(() => {
    if (issueTypes.length > 0 && !issueType) {
      setIssueType(issueTypes[0].name);
    }
  }, [issueTypes]);

  const pushMutation = useMutation({
    mutationFn: () => {
      if (!selectedIntegration) throw new Error('No integration selected');
      return pushToExternal(feedbackGroupId, {
        integrationId: selectedIntegration.id,
        projectKey: selectedIntegration.provider === 'JIRA' ? selectedProject : undefined,
        issueType: selectedIntegration.provider === 'JIRA' ? issueType : undefined,
        listId: selectedIntegration.provider === 'CLICKUP' ? selectedProject : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-groups'] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('integrations.push.error'));
    },
  });

  const handleSubmit = () => {
    if (!selectedProject) {
      setError(
        selectedIntegration?.provider === 'JIRA'
          ? t('integrations.push.selectProject')
          : t('integrations.push.selectList'),
      );
      return;
    }
    if (selectedIntegration?.provider === 'JIRA' && !issueType) {
      setError(t('integrations.push.selectIssueType'));
      return;
    }
    setError(null);
    pushMutation.mutate();
  };

  const handleIntegrationSelect = (integration: IntegrationResponse) => {
    setSelectedIntegration(integration);
    setSelectedProject('');
    setIssueType('');
    setError(null);
  };

  const handleProjectSelect = (projectKey: string) => {
    setSelectedProject(projectKey);
    setIssueType('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('integrations.push.title')}</DialogTitle>
        </DialogHeader>
      <div className="space-y-5">
        {/* Feedback group info */}
        <div className="rounded-lg bg-warm-50 px-3 py-2 dark:bg-warm-800">
          <p className="text-xs text-muted-foreground">{t('integrations.push.pushingItem')}</p>
          <p className="font-medium text-foreground">{feedbackGroupTitle}</p>
        </div>

        {/* Integration selector */}
        {loadingIntegrations ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          </div>
        ) : integrations.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            {t('integrations.push.noIntegrations')}
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t('integrations.push.selectIntegration')}
            </p>
            <div className="flex gap-2">
              {integrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => handleIntegrationSelect(integration)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    selectedIntegration?.id === integration.id
                      ? 'border-primary-300 bg-primary-50 text-primary-700 ring-2 ring-primary-300 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-600'
                      : 'border-border bg-card text-foreground hover:bg-accent'
                  }`}
                >
                  {integration.provider === 'JIRA' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.678 7.395l3.63 2.768c1.328-1.735 3.286-2.755 5.446-2.755s4.103 1.005 5.39 2.725l3.66-2.727C19.312 4.367 16.06 2.662 12.754 2.662c-3.338 0-6.545 1.723-9.076 4.733z" />
                    </svg>
                  )}
                  {integration.provider === 'JIRA' ? 'Jira' : 'ClickUp'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Project / List selector */}
        {selectedIntegration && (
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              {selectedIntegration.provider === 'JIRA'
                ? t('integrations.push.project')
                : t('integrations.push.list')}
            </label>
            {loadingProjects ? (
              <div className="flex justify-center py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
              </div>
            ) : (
              <select
                value={selectedProject}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
              >
                <option value="">
                  {selectedIntegration.provider === 'JIRA'
                    ? t('integrations.push.selectProject')
                    : t('integrations.push.selectList')}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.key || p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Issue type (Jira only) */}
        {selectedIntegration?.provider === 'JIRA' && selectedProject && (
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              {t('integrations.push.issueType')}
            </label>
            {loadingIssueTypes ? (
              <div className="flex justify-center py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
              </div>
            ) : (
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
              >
                <option value="">{t('integrations.push.selectIssueType')}</option>
                {issueTypes.map((it) => (
                  <option key={it.id} value={it.name}>{it.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedIntegration || !selectedProject || pushMutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50"
          >
            {pushMutation.isPending ? t('common.loading') : t('integrations.push.createIssue')}
          </button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}
