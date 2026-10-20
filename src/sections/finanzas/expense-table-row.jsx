import { useTranslation } from 'react-i18next';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  pendiente: 'warning',
  aprobado: 'info',
  rechazado: 'error',
  pagado: 'success',
};

export function ExpenseTableRow({ expense, detailsHref, editHref, onDelete }) {
  const { t } = useTranslation();

  return (
    <TableRow hover>
      <TableCell>
        <Link component={RouterLink} href={detailsHref} color="inherit" underline="always">
          <Typography variant="subtitle2" noWrap>
            {expense.detail || t(`label_expense_category`)}
          </Typography>
        </Link>
        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
          {expense.category}
          {expense.subcategory ? ` · ${expense.subcategory}` : ''}
        </Typography>
      </TableCell>

      <TableCell>{expense.beneficiary_name || '—'}</TableCell>

      <TableCell>{fDate(expense.expense_date)}</TableCell>

      <TableCell align="right">{fCurrency(expense.total_amount)}</TableCell>

      <TableCell align="right">
        {fCurrency(Math.max(expense.total_amount - expense.paid_amount, 0))}
      </TableCell>

      <TableCell>
        <Label variant="soft" color={STATUS_COLOR[expense.status] || 'default'}>
          {t(`label_status_${expense.status}`)}
        </Label>
      </TableCell>

      <TableCell align="right" sx={{ px: 1 }}>
        <Stack direction="row" justifyContent="flex-end">
          {expense.status === 'pendiente' && (
            <IconButton component={RouterLink} href={editHref}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          )}
          {expense.status === 'pendiente' && (
            <IconButton color="error" onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
