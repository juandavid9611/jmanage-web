import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function BankAccountTableRow({ account, onEdit, onDeactivate, onAdjust }) {
  const { t } = useTranslation();

  return (
    <TableRow hover sx={{ opacity: account.is_active ? 1 : 0.5 }}>
      <TableCell>
        <Typography variant="subtitle2">{account.name}</Typography>
      </TableCell>

      <TableCell>
        <Chip size="small" variant="soft" label={t(`label_account_type_${account.type}`)} />
      </TableCell>

      <TableCell align="right">
        <Typography
          variant="subtitle2"
          sx={{ color: account.balance < 0 ? 'error.main' : 'text.primary' }}
        >
          {fCurrency(account.balance)}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" justifyContent="flex-end">
          <IconButton onClick={onAdjust}>
            <Iconify icon="solar:wallet-money-bold" />
          </IconButton>

          <IconButton onClick={onEdit}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>

          {account.is_active && (
            <IconButton color="error" onClick={onDeactivate}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
