import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { FILE_TYPE_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { deleteFile, deleteFiles, useGetFiles } from 'src/actions/fileManager';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { fileFormat } from 'src/components/file-thumbnail';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, rowInPage, getComparator } from 'src/components/table';

import { FileManagerTable } from '../file-manager-table';
import { FileManagerFilters } from '../file-manager-filters';
import { FileManagerGridView } from '../file-manager-grid-view';
import { FileManagerFiltersResult } from '../file-manager-filters-result';
import { FileManagerNewFileDialog } from '../file-manager-new-file-dialog';
// ----------------------------------------------------------------------

export function FileManagerView() {
  const table = useTable({ defaultRowsPerPage: 10 });

  const { workspaceRole } = useWorkspace();
  const isAdmin = workspaceRole === 'admin';

  const confirm = useBoolean();

  const upload = useBoolean();

  const [view, setView] = useState('grid');

  const { files, filesLoading } = useGetFiles();

  const filters = useSetState({
    name: '',
    type: [],
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const dataFiltered = applyFilter({
    inputData: files,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name ||
    filters.state.type.length > 0 ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleChangeView = useCallback((event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  }, []);

  const handleDeleteItem = useCallback(
    async (id) => {
      try {
        await deleteFile(id);
        toast.success('Archivo eliminado!');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        toast.error('Error al eliminar archivo');
        console.error(error);
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteItems = useCallback(
    async () => {
      try {
        await deleteFiles(table.selected);
        toast.success('Archivos eliminados!');
        table.onUpdatePageDeleteRows({
          totalRowsInPage: dataInPage.length,
          totalRowsFiltered: dataFiltered.length,
        });
      } catch (error) {
        toast.error('Error al eliminar archivos');  
        console.error(error);
      }
    },
    [dataFiltered.length, dataInPage.length, table]
  );

  const renderFilters = (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
    >
      <FileManagerFilters
        filters={filters}
        onResetPage={table.onResetPage}
        options={{ types: FILE_TYPE_OPTIONS }}
      />

      <ToggleButtonGroup size="small" value={view} exclusive onChange={handleChangeView}>
        <ToggleButton value="grid">
          <Iconify icon="mingcute:dot-grid-fill" />
        </ToggleButton>
        <ToggleButton value="list">
          <Iconify icon="solar:list-bold" />
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );

  const renderResults = (
    <FileManagerFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      onResetPage={table.onResetPage}
    />
  );

  return (
    <>
      <DashboardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Archivos</Typography>
          {isAdmin && (<Button
            variant="contained"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            onClick={upload.onTrue}
          >
            Subir archivos
          </Button>)}
        </Stack>

        <Stack spacing={2.5} sx={{ my: { xs: 3, md: 5 } }}>
          {renderFilters}

          {canReset && renderResults}
        </Stack>

        {filesLoading ? (
          <Box
            gap={3}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }}
          >
            {[...Array(8)].map((_, index) => (
              <Skeleton key={index} variant="rounded" height={200} />
            ))}
          </Box>
        ) : notFound ? (
          <EmptyContent filled sx={{ py: 10 }} />
        ) : (
          <>
            {view === 'grid' ? (
              <FileManagerGridView
                table={table}
                dataFiltered={dataFiltered}
                onDeleteItem={handleDeleteItem}
                onOpenConfirm={confirm.onTrue}
              />
            ) : (
              <FileManagerTable
                table={table}
                dataFiltered={dataFiltered}
                onDeleteRow={handleDeleteItem}
                notFound={notFound}
                onOpenConfirm={confirm.onTrue}
              />
            )}
          </>
        )}
      </DashboardContent>

      {isAdmin && (<FileManagerNewFileDialog open={upload.value} onClose={upload.onFalse} />)}

      {isAdmin && (<ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Eliminar"
        content={
          <>
            ¿Estás seguro de eliminar <strong> {table.selected.length} </strong> archivos?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteItems();
              confirm.onFalse();
            }}
          >
            Eliminar
          </Button>
        }
      />)}
    </>
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, type, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (file) => file.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (type.length) {
    inputData = inputData.filter((file) => type.includes(fileFormat(file.type)));
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((file) => fIsBetween(file.createdAt, startDate, endDate));
    }
  }

  return inputData;
}
