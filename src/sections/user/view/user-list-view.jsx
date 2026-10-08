import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import { Box } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { GROUP_OPTIONS, USER_STATUS_OPTIONS } from 'src/_mock';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { deleteWorkspace, useGetAllWorkspaces } from 'src/actions/workspaces';
import { deleteUser, useGetUsers, useGetTeamOwnerTeams } from 'src/actions/user';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { UserTableRow } from '../user-table-row';
import { UserTableToolbar } from '../user-table-toolbar';
import { AdminInviteDialog } from '../admin-invite-dialog';
import { WorkspaceCreateDialog } from '../workspace-create-dialog';
import { UserBulkCategoryDialog } from '../user-bulk-category-dialog';
import { UserTableFiltersResult } from '../user-table-filters-result';
import { SCOPE_ALL, SCOPE_UNASSIGNED, UserCategoryScope } from '../user-category-scope';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'all' }, ...USER_STATUS_OPTIONS];

// Club accounts: club-membership fields (identity card, jersey number, EPS).
const CLUB_TABLE_HEAD = [
  { id: '', width: 88 },
  { id: 'name', label: 'name' },
  { id: 'categories', label: 'categories', width: 220, hideOnXs: true },
  { id: 'phoneNumber', label: 'phone_number', width: 180 },
  { id: 'identityCardNumber', label: 'identity_card', width: 220 },
  { id: 'shirtNumber', label: 'shirt_number', width: 180 },
  { id: 'eps', label: 'eps', width: 180 },
  { id: 'role', label: 'role', width: 100 },
  { id: 'confirmationStatus', label: 'status', width: 100 },
];

// Tournament accounts: "users" are mostly team owners/managers — club-membership
// fields (identity card, jersey number, EPS, phone) don't apply; show which team
// instead. Trailing blank entry matches the row's unlabeled actions column.
const TOURNAMENT_TABLE_HEAD = [
  { id: '', width: 88 },
  { id: 'name', label: 'name' },
  { id: 'team', label: 'team', width: 260 },
  { id: 'role', label: 'role', width: 100 },
  { id: 'confirmationStatus', label: 'status', width: 100 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function UserListView() {
  const table = useTable();

  const router = useRouter();

  const confirm = useBoolean();
  const adminInviteDialog = useBoolean();
  const categoryDialog = useBoolean();
  const bulkDialog = useBoolean();

  const [tableData, setTableData] = useState([]);

  const { user } = useAuthContext();
  const { selectedWorkspace, selectWorkspace } = useWorkspace();

  const isTournamentAccount =
    (user?.accounts?.[user?.activeAccountId]?.settings?.account_type ?? 'club') === 'tournament';

  const canCreateCategory =
    !isTournamentAccount && user?.accountsRoles?.[user?.activeAccountId] === 'admin';

  const deleteCategoryDialog = useBoolean();
  const [deletingCategory, setDeletingCategory] = useState(false);


  // Club accounts load the whole account (no workspace_id) so categories can be
  // filtered/assigned client-side without switching the active workspace.
  const showCategories = !isTournamentAccount;
  const {
    users: rawUsers,
    usersLoading,
    usersEmpty,
  } = useGetUsers(selectedWorkspace, true, showCategories);
  const { allWorkspaces } = useGetAllWorkspaces(showCategories);
  const workspacesById = useMemo(
    () => new Map(allWorkspaces.map((ws) => [ws.id, ws])),
    [allWorkspaces]
  );

  // A membership that points at a workspace that no longer exists (e.g. a stale
  // default id) is not a category: those users count as unassigned.
  const fetchedUsers = useMemo(() => {
    if (!showCategories || !workspacesById.size) return rawUsers;
    return rawUsers.map((u) => ({
      ...u,
      memberships: (u.memberships || []).filter((m) =>
        workspacesById.has(m.workspace_id ?? m.workspaceId)
      ),
    }));
  }, [rawUsers, showCategories, workspacesById]);

  // Scope defaults to the active workspace (same list as before); null = follow it.
  const [scopeChoice, setScopeChoice] = useState(null);
  const scope = showCategories ? (scopeChoice ?? selectedWorkspace?.id ?? SCOPE_ALL) : SCOPE_ALL;
  const sourceWorkspaceId = workspacesById.has(scope) ? scope : undefined;

  const hasMembership = (u, wsId) =>
    (u.memberships || []).some((m) => (m.workspace_id ?? m.workspaceId) === wsId);

  const scopeCounts = useMemo(() => {
    const counts = { [SCOPE_ALL]: fetchedUsers.length, [SCOPE_UNASSIGNED]: 0 };
    fetchedUsers.forEach((u) => {
      const ms = u.memberships || [];
      if (!ms.length) counts[SCOPE_UNASSIGNED] += 1;
      ms.forEach((m) => {
        const id = m.workspace_id ?? m.workspaceId;
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return counts;
  }, [fetchedUsers]);

  const users = useMemo(() => {
    if (!showCategories || scope === SCOPE_ALL) return fetchedUsers;
    if (scope === SCOPE_UNASSIGNED) return fetchedUsers.filter((u) => !u.memberships?.length);
    return fetchedUsers
      .filter((u) => hasMembership(u, scope))
      .map((u) => ({
        ...u,
        // Show the role the user has in the scoped category.
        role: u.memberships.find((m) => (m.workspace_id ?? m.workspaceId) === scope)?.role ?? u.role,
      }));
  }, [fetchedUsers, scope, showCategories]);

  const scopedCategory = canCreateCategory ? workspacesById.get(scope) : undefined;

  const handleDeleteCategory = useCallback(async () => {
    if (!scopedCategory) return;
    setDeletingCategory(true);
    try {
      await deleteWorkspace(scopedCategory.id);
      toast.success(t('label_category_deleted'));
      table.onResetPage();
      table.setSelected([]);
      setScopeChoice(SCOPE_ALL);
      deleteCategoryDialog.onFalse();
    } catch (error) {
      const detail = error?.response?.status === 409 ? error.response.data?.detail : null;
      const code = detail?.code;
      if (code === 'default_workspace') {
        toast.error(t('label_category_delete_default'));
      } else if (code === 'has_members') {
        toast.error(
          t('label_category_delete_members', { count: scopeCounts[scopedCategory.id] ?? 0 })
        );
      } else if (code === 'has_events') {
        toast.error(t('label_category_delete_events'));
      } else {
        toast.error(t('label_category_delete_error'));
      }
      deleteCategoryDialog.onFalse();
    } finally {
      setDeletingCategory(false);
    }
  }, [scopedCategory, scopeCounts, table, t, deleteCategoryDialog]);

  const usersById = useMemo(() => new Map(fetchedUsers.map((u) => [u.id, u])), [fetchedUsers]);
  const { teamOwnerTeams } = useGetTeamOwnerTeams(isTournamentAccount);

  const teamNamesByUserId = teamOwnerTeams.reduce((acc, item) => {
    const key = item.owner_user_id;
    acc[key] = acc[key] ? `${acc[key]}, ${item.team_name}` : item.team_name;
    return acc;
  }, {});

  const tableHead = isTournamentAccount ? TOURNAMENT_TABLE_HEAD : CLUB_TABLE_HEAD;

  const filters = useSetState({ name: '', group: [], status: 'all' });

  const { t } = useTranslation();

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name || filters.state.group.length > 0 || filters.state.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || usersEmpty;

  const handleDeleteRow = useCallback(
    (id) => {
      deleteUser(id);
      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success(t('delete_success'));

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData, t]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    toast.success('¡Eliminado con éxito!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.admin.user.edit(id));
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

  const handleScopeChange = useCallback(
    (value) => {
      table.onResetPage();
      table.setSelected([]);
      setScopeChoice(value);
    },
    [table]
  );

  useEffect(() => {
    setTableData(users);
  }, [users]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('users')}
          links={[
            { name: t('app'), href: paths.dashboard.root },
            { name: t('user'), href: paths.dashboard.admin.user.root },
            { name: t('list') },
          ]}
          action={
            <Stack direction="row" spacing={1}>
              {canCreateCategory && (
                <Button
                  variant="soft"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={categoryDialog.onTrue}
                >
                  {t('label_new_category')}
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={adminInviteDialog.onTrue}
              >
                {t('label_create_admin')}
              </Button>
            </Stack>
          }
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={t(tab.label)}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.status) && 'filled') || 'soft'
                    }
                    color={
                      (tab.value === 'confirmed' && 'success') ||
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'disabled' && 'error') ||
                      'default'
                    }
                  >
                    {['confirmed', 'pending', 'disabled'].includes(tab.value)
                      ? users.filter((u) =>
                          u.status === 'active'
                            ? u.confirmationStatus === tab.value
                            : u.status === tab.value
                        ).length
                      : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          {showCategories && (
            <UserCategoryScope
              value={scope}
              onChange={handleScopeChange}
              workspaces={allWorkspaces}
              counts={scopeCounts}
              onDeleteCategory={scopedCategory ? deleteCategoryDialog.onTrue : undefined}
            />
          )}

          <UserTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ groups: GROUP_OPTIONS }}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Stack direction="row" alignItems="center" spacing={1}>
                  {showCategories && (
                    <Button
                      size="small"
                      color="primary"
                      variant="soft"
                      startIcon={<Iconify icon="solar:users-group-rounded-bold" />}
                      onClick={bulkDialog.onTrue}
                    >
                      {t('assign_to_category')}
                    </Button>
                  )}
                  <Tooltip title={t('delete')}>
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={tableHead}
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
                  {usersLoading ? (
                    [...Array(table.rowsPerPage)].map((i, index) => (
                      <TableSkeleton key={index} height={table.dense ? 56 : 56 + 20} />
                    ))
                  ) : (
                    <>
                      {dataFiltered
                        .slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <UserTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                            onEditRow={() => handleEditRow(row.id)}
                            teamName={isTournamentAccount ? teamNamesByUserId[row.id] : undefined}
                            isTournamentAccount={isTournamentAccount}
                            workspacesById={showCategories ? workspacesById : undefined}
                          />
                        ))}
                    </>
                  )}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, tableData.length)}
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

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('delete')}
        content={
          <>
            {t('delete_confirmation')} <strong> {table.selected.length} </strong>{' '}
            {t('delete_confirmation_2')}
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            {t('delete')}
          </Button>
        }
      />

      {showCategories && (
        <UserBulkCategoryDialog
          open={bulkDialog.value}
          onClose={bulkDialog.onFalse}
          onDone={() => table.setSelected([])}
          userIds={table.selected}
          usersById={usersById}
          workspaces={allWorkspaces}
          sourceWorkspaceId={sourceWorkspaceId}
        />
      )}

      {scopedCategory && (
        <ConfirmDialog
          open={deleteCategoryDialog.value}
          onClose={deleteCategoryDialog.onFalse}
          title={t('label_delete_category')}
          content={t('label_delete_category_confirm', { name: scopedCategory.name })}
          action={
            <Button
              variant="contained"
              color="error"
              disabled={deletingCategory}
              onClick={handleDeleteCategory}
            >
              {t('label_delete_category')}
            </Button>
          }
        />
      )}

      <AdminInviteDialog open={adminInviteDialog.value} onClose={adminInviteDialog.onFalse} />

      {canCreateCategory && (
        <WorkspaceCreateDialog
          open={categoryDialog.value}
          onClose={categoryDialog.onFalse}
          onCreated={selectWorkspace}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, group } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (user) => user.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) =>
      user.status === 'active' ? user.confirmationStatus === status : user.status === status
    );
  }

  if (group.length) {
    inputData = inputData.filter((user) => group.includes(user.group));
  }

  return inputData;
}
