import { useParams } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { InvoiceListView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

/**
 * Reuses the same payment-requests list/table clubs use for "Pagos Totales",
 * scoped to a tournament instead of a workspace. "Generar Cobros" writes
 * payment requests with group=tournamentId, so passing the tournament id as
 * the scope here surfaces exactly those rows via the existing generic list
 * endpoint — no backend change needed.
 */
export function TournamentPaymentsView() {
  const { id } = useParams();

  return (
    <InvoiceListView
      scopeId={id}
      title="Pagos del Torneo"
      readOnly
      breadcrumbLinks={[
        { name: 'Torneos', href: paths.dashboard.tournament.root },
        { name: 'Torneo', href: paths.dashboard.tournament.details(id) },
        { name: 'Pagos' },
      ]}
    />
  );
}
