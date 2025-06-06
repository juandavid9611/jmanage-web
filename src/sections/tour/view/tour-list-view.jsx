import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { orderBy } from 'src/utils/helper';
import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { useGetTours } from 'src/actions/tours';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { _tours, _tourGuides, TOUR_SORT_OPTIONS, TOUR_SERVICE_OPTIONS } from 'src/_mock';

import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { TourList } from '../tour-list';
import { TourSort } from '../tour-sort';
import { TourSearch } from '../tour-search';
import { TourFilters } from '../tour-filters';
import { TourFiltersResult } from '../tour-filters-result';

// ----------------------------------------------------------------------

export function TourListView() {
  const { user } = useAuthContext();
  const isAdmin = user.role === 'admin';
  const { selectedWorkspace } = useWorkspace();
  const { tours } = useGetTours(selectedWorkspace?.id);

  const openFilters = useBoolean();

  const [sortBy, setSortBy] = useState('latest');

  const search = useSetState({ query: '', results: [] });

  const filters = useSetState({
    destination: [],
    tourGuides: [],
    services: [],
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const dataFiltered = applyFilter({
    inputData: tours,
    filters: filters.state,
    sortBy,
    dateError,
  });

  const canReset =
    filters.state.destination.length > 0 ||
    filters.state.tourGuides.length > 0 ||
    filters.state.services.length > 0 ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = !dataFiltered.length && canReset;

  const handleSortBy = useCallback((newValue) => {
    setSortBy(newValue);
  }, []);

  const handleSearch = useCallback(
    (inputValue) => {
      search.setState({ query: inputValue });

      if (inputValue) {
        const results = _tours.filter(
          (tour) => tour.name.toLowerCase().indexOf(search.state.query.toLowerCase()) !== -1
        );

        search.setState({ results });
      }
    },
    [search]
  );

  const renderFilters = (
    <Stack
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      direction={{ xs: 'column', sm: 'row' }}
    >
      <TourSearch search={search} onSearch={handleSearch} />

      <Stack direction="row" spacing={1} flexShrink={0}>
        <TourFilters
          filters={filters}
          canReset={canReset}
          dateError={dateError}
          open={openFilters.value}
          onOpen={openFilters.onTrue}
          onClose={openFilters.onFalse}
          options={{
            tourGuides: _tourGuides,
            services: TOUR_SERVICE_OPTIONS.map((option) => option.label),
          }}
        />

        <TourSort sort={sortBy} onSort={handleSortBy} sortOptions={TOUR_SORT_OPTIONS} />
      </Stack>
    </Stack>
  );

  const renderResults = <TourFiltersResult filters={filters} totalResults={dataFiltered.length} />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="List"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tour', href: paths.dashboard.admin.tour.root },
          { name: 'List' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters}

        {canReset && renderResults}
      </Stack>

      {notFound && <EmptyContent filled sx={{ py: 10 }} />}

      <TourList tours={dataFiltered} />
    </DashboardContent>
  );
}

const applyFilter = ({ inputData, filters, sortBy, dateError }) => {
  const { services, destination, startDate, endDate, tourGuides } = filters;

  const tourGuideIds = tourGuides.map((tourGuide) => tourGuide.id);

  // Filters
  if (destination.length) {
    inputData = inputData.filter((tour) => destination.includes(tour.destination));
  }

  if (tourGuideIds.length) {
    inputData = inputData.filter((tour) =>
      tour.tourGuides.some((filterItem) => tourGuideIds.includes(filterItem.id))
    );
  }

  if (services.length) {
    inputData = inputData.filter((tour) => tour.services.some((item) => services.includes(item)));
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((tour) =>
        fIsBetween(startDate, tour.available.startDate, tour.available.endDate)
      );
    }
  }

  // Sort by
  if (sortBy === 'latest') {
    inputData = orderBy(inputData, ['available.startDate'], ['desc']);
  }

  if (sortBy === 'oldest') {
    inputData = orderBy(inputData, ['available.startDate'], ['asc']);
  }

  if (sortBy === 'popular') {
    inputData = orderBy(inputData, ['totalViews'], ['desc']);
  }

  return inputData;
};
