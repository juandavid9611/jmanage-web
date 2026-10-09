import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function ProductFiltersResult({ filters, totalResults, sx }) {
  const { t } = useTranslation();
  const handleRemoveGender = (inputValue) => {
    const newValue = filters.state.gender.filter((item) => item !== inputValue);

    filters.setState({ gender: newValue });
  };

  const handleRemoveCategory = () => {
    filters.setState({ category: 'all' });
  };

  const handleRemoveColor = (inputValue) => {
    const newValue = filters.state.colors.filter((item) => item !== inputValue);

    filters.setState({ colors: newValue });
  };

  const handleRemovePrice = () => {
    filters.setState({ priceRange: null });
  };

  const handleRemoveRating = () => {
    filters.setState({ rating: '' });
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label={t('label_gender_colon')} isShow={!!filters.state.gender.length}>
        {filters.state.gender.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveGender(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label={t('label_category_colon')} isShow={filters.state.category !== 'all'}>
        <Chip {...chipProps} label={filters.state.category} onDelete={handleRemoveCategory} />
      </FiltersBlock>

      <FiltersBlock label={t('label_jersey_location_colon')} isShow={!!filters.state.colors.length}>
        {filters.state.colors.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveColor(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label={t('label_price_colon')} isShow={!!filters.state.priceRange}>
        <Chip
          {...chipProps}
          label={`$${filters.state.priceRange?.[0]} - ${filters.state.priceRange?.[1]}`}
          onDelete={handleRemovePrice}
        />
      </FiltersBlock>

      <FiltersBlock label={t('label_rating_colon')} isShow={!!filters.state.rating}>
        <Chip {...chipProps} label={filters.state.rating} onDelete={handleRemoveRating} />
      </FiltersBlock>
    </FiltersResult>
  );
}
