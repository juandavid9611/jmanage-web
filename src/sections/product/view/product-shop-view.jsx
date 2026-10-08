import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSetState } from 'src/hooks/use-set-state';

import { getLivePrice } from 'src/utils/product-price';

import { useSearchProducts } from 'src/actions/product';
import {
  PRODUCT_SORT_OPTIONS,
  PRODUCT_COLOR_OPTIONS,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_RATING_OPTIONS,
} from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { ProductList } from '../product-list';
import { ProductSort } from '../product-sort';
import { ProductSearch } from '../product-search';
import { CartIcon } from '../components/cart-icon';
import { ProductFilters } from '../product-filters';
import { useCheckoutContext } from '../../checkout/context';
import { ProductFiltersResult } from '../product-filters-result';

// ----------------------------------------------------------------------

// Slider bounds derived from the loaded products' live prices (max rounded up to a nice step).
function getPriceBounds(products) {
  const maxPrice = products.reduce((max, product) => Math.max(max, getLivePrice(product)), 0);

  if (!maxPrice) return { bounds: [0, 100], step: 1 };

  const step = 10 ** Math.max(0, Math.floor(Math.log10(maxPrice)) - 2);

  return { bounds: [0, Math.ceil(maxPrice / step) * step], step };
}

// ----------------------------------------------------------------------

export function ProductShopView({ products, loading, error, onRetry }) {
  const { t } = useTranslation();
  const checkout = useCheckoutContext();

  const openFilters = useBoolean();

  const [sortBy, setSortBy] = useState('featured');

  const [searchQuery, setSearchQuery] = useState('');

  const debouncedQuery = useDebounce(searchQuery);

  const filters = useSetState({
    gender: [],
    colors: [],
    rating: '',
    category: 'all',
    priceRange: null, // null = no price filter (full range derived from products)
  });

  const { searchResults, searchLoading } = useSearchProducts(debouncedQuery);

  const { bounds: priceBounds, step: priceStep } = useMemo(
    () => getPriceBounds(products),
    [products]
  );

  const categories = useMemo(
    () => [
      'all',
      ...[...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    ],
    [products]
  );

  const dataFiltered = applyFilter({ inputData: products, filters: filters.state, sortBy });

  const canReset =
    filters.state.gender.length > 0 ||
    filters.state.colors.length > 0 ||
    filters.state.rating !== '' ||
    filters.state.category !== 'all' ||
    filters.state.priceRange !== null;

  const hasData = !loading && !error;
  const productsEmpty = hasData && !products.length;
  const notFound = hasData && !!products.length && !dataFiltered.length;

  const handleSortBy = useCallback((newValue) => {
    setSortBy(newValue);
  }, []);

  const handleSearch = useCallback((inputValue) => {
    setSearchQuery(inputValue);
  }, []);

  const renderFilters = (
    <Stack
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      direction={{ xs: 'column', sm: 'row' }}
    >
      <ProductSearch
        query={debouncedQuery}
        results={searchResults}
        onSearch={handleSearch}
        loading={searchLoading}
      />

      <Stack direction="row" spacing={1} flexShrink={0}>
        <ProductFilters
          filters={filters}
          canReset={canReset}
          open={openFilters.value}
          onOpen={openFilters.onTrue}
          onClose={openFilters.onFalse}
          options={{
            colors: PRODUCT_COLOR_OPTIONS,
            ratings: PRODUCT_RATING_OPTIONS,
            genders: PRODUCT_GENDER_OPTIONS,
            categories,
            priceBounds,
            priceStep,
          }}
        />

        <ProductSort sort={sortBy} onSort={handleSortBy} sortOptions={PRODUCT_SORT_OPTIONS} />
      </Stack>
    </Stack>
  );

  const renderResults = (
    <ProductFiltersResult filters={filters} totalResults={dataFiltered.length} />
  );

  const renderError = (
    <EmptyContent
      filled
      title={t('label_shop_load_error')}
      description={t('label_try_again_later')}
      action={
        onRetry && (
          <Button
            variant="soft"
            onClick={onRetry}
            startIcon={<Iconify icon="solar:restart-bold" />}
            sx={{ mt: 3 }}
          >
            {t('label_retry')}
          </Button>
        )
      }
      sx={{ py: 10 }}
    />
  );

  const renderEmpty = (
    <EmptyContent
      filled
      title={productsEmpty ? t('label_shop_empty') : t('label_no_results_found')}
      description={productsEmpty ? t('label_shop_empty_desc') : undefined}
      sx={{ py: 10 }}
    />
  );

  return (
    <Container sx={{ mb: 15 }}>
      <CartIcon totalItems={checkout.totalItems} />

      <Typography variant="h4" sx={{ my: { xs: 3, md: 5 } }}>
        {t('shop')}
      </Typography>

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters}

        {canReset && renderResults}
      </Stack>

      {error && renderError}

      {(notFound || productsEmpty) && renderEmpty}

      {!error && !notFound && !productsEmpty && (
        <ProductList products={dataFiltered} loading={loading} />
      )}
    </Container>
  );
}

function applyFilter({ inputData, filters, sortBy }) {
  const { gender, category, colors, priceRange, rating } = filters;

  // Sort by (copy: never mutate SWR's cached array). Price sorting uses the live price.
  const sorters = {
    featured: (a, b) => (b.totalSold ?? 0) - (a.totalSold ?? 0),
    newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    priceDesc: (a, b) => getLivePrice(b) - getLivePrice(a),
    priceAsc: (a, b) => getLivePrice(a) - getLivePrice(b),
  };

  inputData = [...inputData].sort(sorters[sortBy] || sorters.featured);

  // filters
  if (gender.length) {
    inputData = inputData.filter((product) => product.gender?.some((i) => gender.includes(i)));
  }

  if (category !== 'all') {
    inputData = inputData.filter((product) => product.category === category);
  }

  if (colors.length) {
    inputData = inputData.filter((product) =>
      product.colors?.some((color) => colors.includes(color))
    );
  }

  if (priceRange) {
    inputData = inputData.filter((product) => {
      const live = getLivePrice(product);
      return live >= priceRange[0] && live <= priceRange[1];
    });
  }

  if (rating) {
    const convertRating = (value) => {
      if (value === 'up4Star') return 4;
      if (value === 'up3Star') return 3;
      if (value === 'up2Star') return 2;
      return 1;
    };

    inputData = inputData.filter((product) => product.totalRatings > convertRating(rating));
  }

  return inputData;
}
