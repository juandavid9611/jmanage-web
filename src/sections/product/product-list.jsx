import { useState } from 'react';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { ProductItem } from './product-item';
import { ProductItemSkeleton } from './product-skeleton';

// ----------------------------------------------------------------------

const PAGE_SIZE = 12;

export function ProductList({ products, loading, ...other }) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  // Clamp: filters can shrink the list below the page the user was on.
  const currentPage = Math.min(page, pageCount);

  const pageItems = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const renderLoading = <ProductItemSkeleton />;

  const renderList = pageItems.map((product) => <ProductItem key={product.id} product={product} />);

  return (
    <>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        }}
        {...other}
      >
        {loading ? renderLoading : renderList}
      </Box>

      {!loading && pageCount > 1 && (
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={(event, value) => setPage(value)}
          sx={{
            mt: { xs: 5, md: 8 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}
    </>
  );
}
