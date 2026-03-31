import { useTranslation } from 'react-i18next';
import IntegrationsSettings from '../components/IntegrationsSettings';

export default function IntegrationsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t('integrations.title')}
      </h1>
      <IntegrationsSettings />
    </div>
  );
}
