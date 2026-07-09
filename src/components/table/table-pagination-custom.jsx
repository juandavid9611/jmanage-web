import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

export function TablePaginationCustom({
  sx,
  dense,
  onChangeDense,
  rowsPerPageOptions = [5, 10, 25],
  ...other
}) {
  const { t } = useTranslation();

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        labelRowsPerPage={t('label_rows_per_page')}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('word_of')} ${count}`}
        component="div"
        {...other}
        sx={{ borderTopColor: 'transparent' }}
      />

      {onChangeDense && (
        <FormControlLabel
          label={t('label_compact')}
          control={<Switch name="dense" checked={dense} onChange={onChangeDense} />}
          sx={{
            pl: 2,
            py: 1.5,
            top: 0,
            position: { sm: 'absolute' },
          }}
        />
      )}
    </Box>
  );
}
