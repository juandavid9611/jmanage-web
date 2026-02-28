import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';

import { createPlayer, updatePlayer, deletePlayer } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const POSITION_OPTIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

const POSITION_LABELS = {
  Goalkeeper: 'Portero',
  Defender: 'Defensa',
  Midfielder: 'Centrocampista',
  Forward: 'Delantero',
};

export function PlayerDataGrid({ tournamentId, teamId, players }) {
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
      { id: tempId, name: '', number: '', position: '', isNew: true },
    ]);
  }, []);

  const handleProcessRowUpdate = useCallback(
    async (newRow, oldRow) => {
      try {
        setSaving(true);

        if (newRow.isNew) {
          // Create via API
          if (!newRow.name) {
            toast.error('El nombre es obligatorio');
            return oldRow;
          }
          const payload = {
            name: newRow.name,
            number: newRow.number ? Number(newRow.number) : 0,
            position: newRow.position || '',
          };
          const created = await createPlayer(tournamentId, teamId, payload);
          // Remove from local rows — it'll appear from the API players on next render
          setRows((prev) => prev.filter((r) => r.id !== newRow.id));
          toast.success(`${newRow.name} agregado`);
          return { ...newRow, id: created.id, isNew: false };
        }

        // Update existing
        const payload = {
          name: newRow.name,
          number: newRow.number ? Number(newRow.number) : 0,
          position: newRow.position || '',
        };
        await updatePlayer(tournamentId, newRow.id, payload);
        toast.success(`${newRow.name} actualizado`);
        return newRow;
      } catch (error) {
        toast.error(error.message || 'Error al guardar');
        return oldRow;
      } finally {
        setSaving(false);
      }
    },
    [tournamentId, teamId]
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
        toast.success('Jugador eliminado');
      } catch (error) {
        toast.error(error.message || 'Error al eliminar');
      }
    },
    [tournamentId]
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
      headerName: 'Nombre',
      flex: 1,
      minWidth: 160,
      editable: true,
    },
    {
      field: 'position',
      headerName: 'Posición',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: POSITION_OPTIONS,
      renderCell: (params) => POSITION_LABELS[params.value] || params.value || '—',
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
          label="Eliminar"
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
          Agregar Jugador
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
          noRowsLabel: 'Sin jugadores — haz clic en "Agregar Jugador"',
          MuiTablePagination: { labelRowsPerPage: 'Filas:' },
        }}
      />
    </Box>
  );
}
