import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { sumBy } from 'src/utils/helper';
import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetPaymentRequestsByUser } from 'src/actions/paymentRequest';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Walktour, useWalktour } from 'src/components/walktour';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { InvoiceAnalytic } from '../invoice-analytic';
import { InvoiceTableRow } from '../invoice-table-row';
import { InvoiceTableToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFiltersResult } from '../invoice-table-filters-result';

// ----------------------------------------------------------------------

function get_table_head(t) {
  return [
    { id: '', width: 88 },
    { id: 'price', label: t('amount') },
    { id: 'status', label: t('status') },
    { id: 'concept', label: t('concept') },
    { id: 'createDate', label: t('creation') },
    { id: 'dueDate', label: t('due') },
    { id: '' },
  ];
}

// ----------------------------------------------------------------------

export function UserInvoiceListView() {
  const { t } = useTranslation();

  const theme = useTheme();

  const router = useRouter();

  const table = useTable({ defaultOrderBy: 'createDate' });

  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);

  const { user } = useAuthContext();
  const { selectedWorkspace } = useWorkspace();

  const { paymentRequests, paymentRequestsLoading, paymentRequestsEmpty } =
    useGetPaymentRequestsByUser(user.id, selectedWorkspace?.id);

  const filters = useSetState({
    name: '',
    service: [],
    status: 'all',
    startDate: null,
    endDate: null,
  });

  // Walktour state
  const [hasSeenInvoiceTour, setHasSeenInvoiceTour] = useState(() => {
    const seen = localStorage.getItem('invoice-payment-tour-seen');
    return !!seen;
  });

  const [tourHelpers, setTourHelpers] = useState(null);

  const walktour = useWalktour({
    defaultRun: !hasSeenInvoiceTour,
    steps: [
      {
        target: '#invoice-analytics-summary',
        title: '💰 Gestiona tus Pagos',
        placement: 'bottom',
        disableBeacon: true,
        hideCloseButton: true,
        content: (
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            Aquí puedes ver todas tus solicitudes de pago del club. Revisa el estado de tus pagos
            y sube comprobantes fácilmente.
          </Box>
        ),
      },
      {
        target: '#invoice-analytics-summary',
        title: '📊 Resumen de Pagos',
        placement: 'bottom',
        disableBeacon: true,
        content: (
          <Stack spacing={1} sx={{ typography: 'body2', color: 'text.secondary' }}>
            <Box>
              En la parte superior puedes ver un resumen de tus pagos:
            </Box>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <li><strong style={{ color: theme.vars.palette.error.main }}>Vencidos:</strong> Pagos que ya pasaron su fecha límite</li>
              <li><strong style={{ color: theme.vars.palette.warning.main }}>Pendientes:</strong> Pagos por realizar</li>
              <li><strong style={{ color: theme.palette.secondary.main }}>En Aprobación:</strong> Comprobantes enviados esperando validación</li>
              <li><strong style={{ color: theme.vars.palette.success.main }}>Pagados:</strong> Pagos completados y aprobados</li>
            </Box>
          </Stack>
        ),
      },
      {
        target: '#invoice-table-container',
        title: '📤 Cómo Subir un Comprobante',
        placement: 'top',
        disableBeacon: true,
        content: (
          <Stack spacing={1.5} sx={{ typography: 'body2', color: 'text.secondary' }}>
            <Box>
              Para realizar un pago, sube tu comprobante haciendo clic en el botón de
              <strong> subir </strong>
              <Iconify 
                icon="lets-icons:upload-fill" 
                sx={{ ml: 0.5, verticalAlign: 'middle', color: 'primary.main' }} 
              />
              que aparece en cada fila de la tabla.
            </Box>
            <Box sx={{ fontSize: '0.875rem', opacity: 0.8, bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
              💡 <strong>Tip:</strong> Busca el ícono de subir al inicio de cada fila de pago
            </Box>
          </Stack>
        ),
      },
      {
        target: '#invoice-status-tabs',
        title: '🔍 Filtra y Busca',
        placement: 'bottom',
        disableBeacon: true,
        content: (
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            Usa las pestañas y la barra de búsqueda para filtrar tus pagos por estado,
            concepto o rango de fechas. ¡Encuentra rápidamente lo que necesitas!
          </Box>
        ),
      },
    ],
  });

  const handleTourCallback = (data) => {
    const { action } = data;
    
    if (action === 'reset') {
      localStorage.setItem('invoice-payment-tour-seen', 'true');
      setHasSeenInvoiceTour(true);
    }
    
    walktour.onCallback(data);
  };

  const handleSetHelpers = (helpers) => {
    setTourHelpers(helpers);
    walktour.setHelpers(helpers);
  };

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name ||
    filters.state.service.length > 0 ||
    filters.state.status !== 'all' ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const getInvoiceLength = (status) => tableData.filter((item) => item.status === status).length;

  const getTotalAmount = (status) =>
    sumBy(
      tableData.filter((item) => item.status === status),
      (invoice) => invoice.totalAmount
    );

  const getPercentByStatus = (status) => (getInvoiceLength(status) / tableData.length) * 100;

  const TABS = [
    {
      value: 'all',
      label: 'All',
      color: 'default',
      count: tableData.length,
    },
    {
      value: 'approval_pending',
      label: 'Approving',
      color: 'secondary',
      count: getInvoiceLength('approval_pending'),
    },
    {
      value: 'pending',
      label: 'Pending',
      color: 'warning',
      count: getInvoiceLength('pending'),
    },
    {
      value: 'overdue',
      label: 'Overdue',
      color: 'error',
      count: getInvoiceLength('overdue'),
    },
    {
      value: 'paid',
      label: 'Paid',
      color: 'success',
      count: getInvoiceLength('paid'),
    },
  ];

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.admin.invoice.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  useEffect(() => {
    setTableData(paymentRequests);
  }, [paymentRequests]);

  return (
    <>
      <Walktour
        run={walktour.run}
        steps={walktour.steps}
        callback={handleTourCallback}
        getHelpers={handleSetHelpers}
        scrollToFirstStep
        disableBeacon
        disableOverlayClose
      />
      <DashboardContent>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: { xs: 3, md: 5 } }}>
        <CustomBreadcrumbs
          heading={t('user_invoices')}
          links={[{ name: t('app'), href: paths.dashboard.root }, { name: t('list') }]}
          sx={{ mb: 0, flexGrow: 1 }}
        />
        <Tooltip title="Ver tutorial de pagos">
          <IconButton 
            onClick={() => {
              setHasSeenInvoiceTour(false);
              walktour.setRun(true);
            }}
            color="primary"
            sx={{ 
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' }
            }}
          >
            <Iconify icon="eva:question-mark-circle-fill" width={24} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Card id="invoice-analytics-summary" sx={{ mb: { xs: 3, md: 5 } }}>
        <Scrollbar sx={{ minHeight: 108 }}>
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
            sx={{ py: 2 }}
          >
            <InvoiceAnalytic
              title={t('overdue')}
              total={getInvoiceLength('overdue')}
              percent={getPercentByStatus('overdue')}
              price={getTotalAmount('overdue')}
              icon="solar:bell-bing-bold-duotone"
              color={theme.vars.palette.error.main}
            />
            <InvoiceAnalytic
              title={t('pending')}
              total={getInvoiceLength('pending')}
              percent={getPercentByStatus('pending')}
              price={getTotalAmount('pending')}
              icon="solar:sort-by-time-bold-duotone"
              color={theme.vars.palette.warning.main}
            />

            <InvoiceAnalytic
              title={t('approval_pending')}
              total={getInvoiceLength('approval_pending')}
              percent={getPercentByStatus('approval_pending')}
              price={getTotalAmount('approval_pending')}
              icon="solar:file-corrupted-bold-duotone"
              color={theme.palette.secondary.main}
            />
            <InvoiceAnalytic
              title={t('paid')}
              total={getInvoiceLength('paid')}
              percent={getPercentByStatus('paid')}
              price={getTotalAmount('paid')}
              icon="solar:file-check-bold-duotone"
              color={theme.vars.palette.success.main}
            />
            <InvoiceAnalytic
              title={t('total')}
              total={tableData.length}
              percent={100}
              price={sumBy(tableData, (invoice) => invoice.totalAmount)}
              icon="solar:bill-list-bold-duotone"
              color={theme.vars.palette.info.main}
            />
          </Stack>
        </Scrollbar>
      </Card>

      <Card>
        <Tabs
          id="invoice-status-tabs"
          value={filters.state.status}
          onChange={handleFilterStatus}
          sx={{
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={t(tab.value)}
              iconPosition="end"
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                    'soft'
                  }
                  color={tab.color}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </Tabs>

        <InvoiceTableToolbar
          filters={filters}
          dateError={dateError}
          onResetPage={table.onResetPage}
        />

        {canReset && (
          <InvoiceTableFiltersResult
            filters={filters}
            onResetPage={table.onResetPage}
            totalResults={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box id="invoice-table-container" sx={{ position: 'relative' }}>
          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) => {
              table.onSelectAllRows(
                checked,
                dataFiltered.map((row) => row.id)
              );
            }}
            action={
              <Stack direction="row">
                <Tooltip title="Sent">
                  <IconButton color="primary">
                    <Iconify icon="iconamoon:send-fill" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Download">
                  <IconButton color="primary">
                    <Iconify icon="eva:download-outline" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Print">
                  <IconButton color="primary">
                    <Iconify icon="solar:printer-minimalistic-bold" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              </Stack>
            }
          />

          <Scrollbar sx={{ minHeight: 444 }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={get_table_head(t, false)}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    dataFiltered.map((row) => row.id)
                  )
                }
              />

              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <InvoiceTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onEditRow={() => handleEditRow(row.id)}
                      isAdmin={false}
                    />
                  ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 56 + 20}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
    </>
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, status, service, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (invoice) =>
        invoice.concept.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        invoice.paymentRequestTo.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((invoice) => invoice.status === status);
  }

  if (service.length) {
    inputData = inputData.filter((invoice) =>
      invoice.items.some((filterItem) => service.includes(filterItem.service))
    );
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((invoice) => fIsBetween(invoice.createDate, startDate, endDate));
    }
  }

  return inputData;
}
