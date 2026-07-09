import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';

import { PRODUCT_STOCK_OPTIONS, PRODUCT_PUBLISH_OPTIONS } from 'src/_mock';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function ProductTableFiltersResult({ filters, totalResults, sx }) {
  const { t } = useTranslation();

  const getStockLabel = (value) =>
    t(PRODUCT_STOCK_OPTIONS.find((option) => option.value === value)?.label || value);

  const getPublishLabel = (value) =>
    t(PRODUCT_PUBLISH_OPTIONS.find((option) => option.value === value)?.label || value);

  const handleRemoveStock = useCallback(
    (inputValue) => {
      const newValue = filters.state.stock.filter((item) => item !== inputValue);

      filters.setState({ stock: newValue });
    },
    [filters]
  );

  const handleRemovePublish = useCallback(
    (inputValue) => {
      const newValue = filters.state.publish.filter((item) => item !== inputValue);

      filters.setState({ publish: newValue });
    },
    [filters]
  );

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label={t('label_stock_colon')} isShow={!!filters.state.stock.length}>
        {filters.state.stock.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={getStockLabel(item)}
            onDelete={() => handleRemoveStock(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label={t('label_publish_colon')} isShow={!!filters.state.publish.length}>
        {filters.state.publish.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={getPublishLabel(item)}
            onDelete={() => handleRemovePublish(item)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}
