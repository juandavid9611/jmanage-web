import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

import { CheckoutCartProduct } from './checkout-cart-product';

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() inside TableHeadCustom.
const TABLE_HEAD = [
  { id: '', width: 88 },
  { id: 'product', label: 'product' },
  { id: 'price', label: 'price' },
  { id: 'quantity', label: 'label_quantity' },
  { id: 'totalAmount', label: 'label_total_price', align: 'right' },
];

// ----------------------------------------------------------------------

export function CheckoutCartProductList({
  products,
  onDelete,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) {
  return (
    <Scrollbar>
      <Table sx={{ minWidth: 720 }}>
        <TableHeadCustom headLabel={TABLE_HEAD} />

        <TableBody>
          {products.map((row) => (
            <CheckoutCartProduct
              key={row.id}
              row={row}
              onDelete={() => onDelete(row.id)}
              onDecrease={() => onDecreaseQuantity(row.id)}
              onIncrease={() => onIncreaseQuantity(row.id)}
            />
          ))}
        </TableBody>
      </Table>
    </Scrollbar>
  );
}
