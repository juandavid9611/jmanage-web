import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleBasedGuard } from 'src/auth/guard';

import { FinancialAssistantChat } from '../financial-assistant-chat';

// ----------------------------------------------------------------------

export function FinancialAssistantView() {
  const { t } = useTranslation();
  const { workspaceRole } = useWorkspace();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_ai_assistant')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_ai_assistant') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RoleBasedGuard hasContent currentRole={workspaceRole} acceptRoles={['admin', 'team_owner']}>
        <FinancialAssistantChat />
      </RoleBasedGuard>
    </DashboardContent>
  );
}
