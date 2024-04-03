import sumBy from 'lodash/sumBy';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { fTimestamp } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';
import { useGetPaymentRequestsByUser } from 'src/api/paymentRequest';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import PaymentRequestAnalytic from '../payment-request-analytic';
import PaymentRequestTableRow from '../payment-request-table-row';
import PaymentRequestTableToolbar from '../payment-request-table-toolbar';
import PaymentRequestTableFiltersResult from '../payment-request-table-filters-result';

// ----------------------------------------------------------------------

function get_table_head(t) {
  return [
    { id: 'concept', label: t('concept') },
    { id: 'createDate', label: t('creation') },
    { id: 'dueDate', label: t('due') },
    { id: 'price', label: t('amount') },
    { id: 'status', label: t('status') },
    { id: '' },
  ];
}

const defaultFilters = {
  name: '',
  service: [],
  status: 'all',
  startDate: null,
  endDate: null,
};

// ----------------------------------------------------------------------

export default function EmployeePaymentRequestListView() {
  const { t } = useTranslation();
  const { user } = useAuthContext();

  const theme = useTheme();

  const settings = useSettingsContext();

  const table = useTable({ defaultOrderBy: 'createDate' });

  const [tableData, setTableData] = useState([]);

  const { paymentRequests, paymentRequestsLoading, paymentRequestsEmpty } =
    useGetPaymentRequestsByUser(user.id);

  const [filters, setFilters] = useState(defaultFilters);

  const dateError =
    filters.startDate && filters.endDate
      ? filters.startDate.getTime() > filters.endDate.getTime()
      : false;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
    dateError,
  });

  const denseHeight = table.dense ? 56 : 76;

  const canReset =
    !!filters.name ||
    !!filters.service.length ||
    filters.status !== 'all' ||
    (!!filters.startDate && !!filters.endDate);

  const notFound = (!dataFiltered.length && canReset) || paymentRequestsEmpty;

  const getPaymentRequestLength = (status) =>
    tableData.filter((item) => item.status === status).length;

  const getTotalAmount = (status) =>
    sumBy(
      tableData.filter((item) => item.status === status),
      'totalAmount'
    );

  const getPercentByStatus = (status) => (getPaymentRequestLength(status) / tableData.length) * 100;

  const TABS = [
    { value: 'all', label: 'All', color: 'default', count: tableData.length },
    {
      value: 'paid',
      label: t('paid'),
      color: 'success',
      count: getPaymentRequestLength('paid'),
    },
    {
      value: 'pending',
      label: t('pending'),
      color: 'warning',
      count: getPaymentRequestLength('pending'),
    },
    {
      value: 'overdue',
      label: t('overdue'),
      color: 'error',
      count: getPaymentRequestLength('overdue'),
    },
    {
      value: 'draft',
      label: t('cancelled'),
      color: 'default',
      count: getPaymentRequestLength('draft'),
    },
  ];

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      handleFilters('status', newValue);
    },
    [handleFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  useEffect(() => {
    if (paymentRequests.length) {
      setTableData(paymentRequests);
    }
  }, [paymentRequests]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('payment_requests')}
        links={[
          { name: t('app'), href: paths.dashboard.root },
          {
            name: t('payment_request'),
            href: paths.dashboard.employee.paymentRequest.employeeList,
          },
          { name: t('list') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        <Scrollbar>
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
            sx={{ py: 2 }}
          >
            <PaymentRequestAnalytic
              title={t('total')}
              total={tableData.length}
              percent={100}
              price={sumBy(tableData, 'totalAmount')}
              icon="solar:bill-list-bold-duotone"
              color={theme.palette.info.main}
            />

            <PaymentRequestAnalytic
              title={t('paid')}
              total={getPaymentRequestLength('paid')}
              percent={getPercentByStatus('paid')}
              price={getTotalAmount('paid')}
              icon="solar:file-check-bold-duotone"
              color={theme.palette.success.main}
            />

            <PaymentRequestAnalytic
              title={t('pending')}
              total={getPaymentRequestLength('pending')}
              percent={getPercentByStatus('pending')}
              price={getTotalAmount('pending')}
              icon="solar:sort-by-time-bold-duotone"
              color={theme.palette.warning.main}
            />

            <PaymentRequestAnalytic
              title={t('overdue')}
              total={getPaymentRequestLength('overdue')}
              percent={getPercentByStatus('overdue')}
              price={getTotalAmount('overdue')}
              icon="solar:bell-bing-bold-duotone"
              color={theme.palette.error.main}
            />

            <PaymentRequestAnalytic
              title={t('cancelled')}
              total={getPaymentRequestLength('cancelled')}
              percent={getPercentByStatus('cancelled')}
              price={getTotalAmount('cancelled')}
              icon="solar:file-corrupted-bold-duotone"
              color={theme.palette.text.secondary}
            />
          </Stack>
        </Scrollbar>
      </Card>

      <Card>
        <Tabs
          value={filters.status}
          onChange={handleFilterStatus}
          sx={{
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === filters.status) && 'filled') || 'soft'
                  }
                  color={tab.color}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </Tabs>

        <PaymentRequestTableToolbar
          filters={filters}
          onFilters={handleFilters}
          //
          dateError={dateError}
        />

        {canReset && (
          <PaymentRequestTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            //
            onResetFilters={handleResetFilters}
            //
            results={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={tableData.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                tableData.map((row) => row.id)
              )
            }
          />

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={get_table_head(t)}
                rowCount={tableData.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    tableData.map((row) => row.id)
                  )
                }
              />

              <TableBody>
                {paymentRequestsLoading ? (
                  [...Array(table.rowsPerPage)].map((i, index) => (
                    <TableSkeleton key={index} sx={{ height: denseHeight }} />
                  ))
                ) : (
                  <>
                    {dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <PaymentRequestTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          isAdmin={false}
                        />
                      ))}
                  </>
                )}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, tableData.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          //
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>
    </Container>
  );
}

// ----------------------------------------------------------------------

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
      (paymentRequest) =>
        paymentRequest.concept.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        paymentRequest.paymentRequestTo.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((paymentRequest) => paymentRequest.status === status);
  }

  if (service.length) {
    inputData = inputData.filter((paymentRequest) =>
      paymentRequest.items.some((filterItem) => service.includes(filterItem.service))
    );
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter(
        (paymentRequest) =>
          fTimestamp(paymentRequest.createDate) >= fTimestamp(startDate) &&
          fTimestamp(paymentRequest.createDate) <= fTimestamp(endDate)
      );
    }
  }

  return inputData;
}
