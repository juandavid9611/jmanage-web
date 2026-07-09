import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';

import { createPlayer, updatePlayer, deletePlayer } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const POSITION_OPTIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

// label values below are i18n keys, resolved via t() at render time.
const POSITION_LABELS = {
  Goalkeeper: 'label_position_goalkeeper',
  Defender: 'label_position_defender',
  Midfielder: 'label_position_midfielder',
  Forward: 'label_position_forward',
};

export function PlayerDataGrid({ tournamentId, teamId, players }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  // Merge API players with local new rows
  const allRows = [
    ...players.map((p) => ({
      id: p.id,
      name: p.name || '',
      number: p.number ?? '',
      position: p.position || '',
      isNew: false,
    })),
    ...rows,
  ];

  const handleAddRow = useCallback(() => {
    const tempId = `new_${Date.now()}`;
    setRows((prev) => [
      ...prev,
      { id: tempId, name: '', number: '', position: 'Forward', isNew: true },
    ]);
  }, []);

  const handleProcessRowUpdate = useCallback(
    async (newRow, oldRow) => {
      try {
        setSaving(true);

        if (newRow.isNew) {
          // Create via API
          if (!newRow.name) {
            toast.error(t('name_required'));
            return oldRow;
          }
          const payload = {
            name: newRow.name,
            number: newRow.number ? Number(newRow.number) : 0,
            position: newRow.position || 'Forward',
          };
          const created = await createPlayer(tournamentId, teamId, payload);
          // Remove from local rows — it'll appear from the API players on next render
          setRows((prev) => prev.filter((r) => r.id !== newRow.id));
          toast.success(`${newRow.name} ${t('label_added')}`);
          return { ...newRow, id: created.id, isNew: false };
        }

        // Update existing
        const payload = {
          name: newRow.name,
          number: newRow.number ? Number(newRow.number) : 0,
          position: newRow.position || 'Forward',
        };
        await updatePlayer(tournamentId, newRow.id, payload);
        toast.success(`${newRow.name} ${t('label_updated')}`);
        return newRow;
      } catch (error) {
        toast.error(error.message || t('label_error_saving'));
        return oldRow;
      } finally {
        setSaving(false);
      }
    },
    [tournamentId, teamId, t]
  );

  const handleDelete = useCallback(
    async (playerId) => {
      try {
        // Check if it's a local (unsaved) row
        if (String(playerId).startsWith('new_')) {
          setRows((prev) => prev.filter((r) => r.id !== playerId));
          return;
        }
        await deletePlayer(tournamentId, playerId);
        toast.success(t('label_player_deleted'));
      } catch (error) {
        toast.error(error.message || t('label_error_deleting'));
      }
    },
    [tournamentId, t]
  );

  const columns = [
    {
      field: 'number',
      headerName: '#',
      width: 70,
      type: 'number',
      editable: true,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'name',
      headerName: t('label_name'),
      flex: 1,
      minWidth: 160,
      editable: true,
    },
    {
      field: 'position',
      headerName: t('label_position'),
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: POSITION_OPTIONS,
      renderCell: (params) =>
        POSITION_LABELS[params.value] ? t(POSITION_LABELS[params.value]) : params.value || '—',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 60,
      getActions: (params) => [
        <GridActionsCellItem
          key="delete"
          icon={<Iconify icon="solar:trash-bin-trash-bold" width={18} />}
          label={t('delete')}
          onClick={() => handleDelete(params.id)}
          color="error"
        />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddRow}
        >
          {t('label_add_player')}
        </Button>
      </Box>

      <DataGrid
        rows={allRows}
        columns={columns}
        loading={saving}
        autoHeight
        density="compact"
        disableColumnMenu
        disableRowSelectionOnClick
        hideFooter={allRows.length <= 10}
        pageSizeOptions={[10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          sorting: { sortModel: [{ field: 'number', sort: 'asc' }] },
        }}
        processRowUpdate={handleProcessRowUpdate}
        onProcessRowUpdateError={(error) => toast.error(error.message)}
        editMode="row"
        sx={{
          '& .MuiDataGrid-cell': { py: 0.5 },
          '& .MuiDataGrid-row--editing .MuiDataGrid-cell': {
            bgcolor: 'action.hover',
          },
          border: 'none',
        }}
        localeText={{
          noRowsLabel: `${t('label_no_players_click_hint_prefix')} "${t('label_add_player')}"`,
          MuiTablePagination: { labelRowsPerPage: t('label_rows_colon') },
        }}
      />
    </Box>
  );
}
