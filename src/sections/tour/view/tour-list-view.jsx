import { useMemo, useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { orderBy } from 'src/utils/helper';

import { useGetTours } from 'src/actions/tours';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TourList } from '../tour-list';
import { TourSeasonStats } from '../tour-season-stats';

// ----------------------------------------------------------------------

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function getTs(t) {
  const s = t.available?.startDate;
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : new Date(s).getTime();
}

// ----------------------------------------------------------------------

export function TourListView() {
  const { selectedWorkspace } = useWorkspace();
  const { tours } = useGetTours(selectedWorkspace?.id, 'match');

  // Derive available months from tours, sorted newest first
  const months = useMemo(() => {
    const seen = new Map();
    tours.forEach((t) => {
      const ts = getTs(t);
      if (!ts) return;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!seen.has(key)) {
        seen.set(key, { key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
      }
    });
    return [...seen.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [tours]);

  // Default to the current (or most recent) month
  const defaultMonth = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return months.find((m) => m.key === currentKey)?.key || months[0]?.key || 'all';
  }, [months]);

  const [selectedMonth, setSelectedMonth] = useState(null);
  const activeMonth = selectedMonth ?? defaultMonth;

  const sorted = useMemo(() => {
    const filtered =
      activeMonth === 'all'
        ? tours
        : tours.filter((t) => {
            const ts = getTs(t);
            if (!ts) return false;
            const d = new Date(ts);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return key === activeMonth;
          });

    const now = Date.now();
    const upcoming = orderBy(filtered.filter((t) => getTs(t) >= now), ['available.startDate'], ['asc']);
    const past = orderBy(filtered.filter((t) => getTs(t) < now), ['available.startDate'], ['desc']);
    return [...upcoming, ...past];
  }, [tours, activeMonth]);

  const countFor = (key) =>
    key === 'all'
      ? tours.length
      : tours.filter((t) => {
          const ts = getTs(t);
          if (!ts) return false;
          const d = new Date(ts);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
        }).length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Partidos"
        links={[{ name: 'Partidos' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TourSeasonStats tours={tours} />

      {months.length > 0 && (
        <Tabs
          value={activeMonth}
          onChange={(_, v) => setSelectedMonth(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
        >
          <Tab
            value="all"
            label={
              <span>
                Todos{' '}
                <Label color="default" sx={{ ml: 0.75 }}>
                  {tours.length}
                </Label>
              </span>
            }
          />
          {months.map((m) => (
            <Tab
              key={m.key}
              value={m.key}
              label={
                <span>
                  {m.label}{' '}
                  <Label color="default" sx={{ ml: 0.75 }}>
                    {countFor(m.key)}
                  </Label>
                </span>
              }
            />
          ))}
        </Tabs>
      )}

      {!sorted.length && <EmptyContent filled sx={{ py: 10 }} />}

      <TourList tours={sorted} />
    </DashboardContent>
  );
}
