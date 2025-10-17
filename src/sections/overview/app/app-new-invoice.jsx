import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

// ----------------------------------------------------------------------

export function AppNewInvoice({ title, subheader, tableData, headLabel, ...other }) {
  const router = useRouter();
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Scrollbar>
        <Table sx={{ minWidth: 680 }}>
          <TableHeadCustom headLabel={headLabel} />

          <TableBody>
            {tableData.map((row) => (
              <RowItem key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </Scrollbar>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
          onClick={() => router.push(paths.dashboard.user.invoice.invoiceList)}
        >
          Ver todos
        </Button>
      </Box>
    </Card>
  );
}

function RowItem({ row }) {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell>
        <Label
          variant="soft"
          color={
            (row.status === 'paid' && 'success') ||
            (row.status === 'pending' && 'warning') ||
            (row.status === 'overdue' && 'error') ||
            (row.status === 'approval_pending' && 'secondary') ||
            'default'
          }
        >
          {t(row.status)}
        </Label>
      </TableCell>
      <TableCell>{fCurrency(row.totalAmount)}</TableCell>
      <TableCell>{row.concept}</TableCell>
      <TableCell>{fDate(row.dueDate)}</TableCell>
      <TableCell>INV-{row.id.slice(-4)}</TableCell>
    </TableRow>
  );
}
