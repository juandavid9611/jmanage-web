import { useWorkspace } from 'src/workspace/workspace-provider';

import { CompromisoAnalyticsView } from 'src/sections/overview/analytics/view/compromiso-analytics-view';

import { MyTournamentsView } from './my-tournaments-view';

// ----------------------------------------------------------------------
// Same nav entry / route for everyone in the workspace — admins and
// coaches get the roster/match management screen, everyone else gets
// their own read-only "which tournaments am I in" view.

export function ClubTournamentsView() {
  const { workspaceRole } = useWorkspace();
  const canManage = workspaceRole === 'admin' || workspaceRole === 'coach';

  return canManage ? <CompromisoAnalyticsView /> : <MyTournamentsView />;
}
