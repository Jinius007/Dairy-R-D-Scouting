'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import rawData from '../../data/developments.json';
import { Header } from '@/components/Header';
import { Hero, StatsBar } from '@/components/Hero';
import { FilterBar } from '@/components/FilterBar';
import { DevelopmentGrid } from '@/components/DevelopmentCard';
import { ChartsSection } from '@/components/Charts';
import { Footer } from '@/components/Footer';
import {
  DevelopmentsData,
  Filters,
  FunctionCategory,
  ALL_FUNCTIONS,
} from '@/lib/types';
import {
  filterDevelopments,
  getUniqueValues,
  countByFunction,
  getMomentumData,
  getThisWeekCount,
  timelineHeading,
} from '@/lib/utils';

const data = rawData as DevelopmentsData;

export default function HomePage() {
  const feedRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>({
    functions: new Set(),
    regions: new Set(),
    companies: new Set(),
    institutions: new Set(),
    rdTypes: new Set(),
    timeline: '12months',
    search: '',
  });

  const { regions, companies, institutions } = useMemo(
    () => getUniqueValues(data.developments),
    []
  );

  const filtered = useMemo(
    () => filterDevelopments(data.developments, filters),
    [filters]
  );

  const allFunctionCounts = useMemo(
    () => countByFunction(data.developments),
    []
  );

  const momentumData = useMemo(
    () => getMomentumData(data.developments),
    []
  );

  const functionsCovered = ALL_FUNCTIONS.filter(
    (fn) => (allFunctionCounts[fn] ?? 0) > 0
  ).length;

  const scrollToFeed = useCallback(() => {
    feedRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSeeYesterday = useCallback(() => {
    setFilters((f) => ({
      ...f,
      timeline: 'yesterday',
      customDate: undefined,
    }));
    setTimeout(scrollToFeed, 100);
  }, [scrollToFeed]);

  const handleFunctionClick = useCallback(
    (fn: FunctionCategory) => {
      setFilters((f) => ({
        ...f,
        functions: new Set([fn]),
        timeline: 'all',
        customDate: undefined,
      }));
      setTimeout(scrollToFeed, 100);
    },
    [scrollToFeed]
  );

  return (
    <main>
      <Header />

      <Hero
        totalTracked={data.metadata.totalTracked}
        functionCounts={allFunctionCounts}
        onExploreFeed={scrollToFeed}
        onSeeYesterday={handleSeeYesterday}
        onFunctionClick={handleFunctionClick}
      />

      <StatsBar
        totalTracked={data.metadata.totalTracked}
        newThisWeek={getThisWeekCount(data.developments)}
        functionsCovered={functionsCovered}
        regionsCount={regions.length}
        lastRefreshed={data.metadata.lastRefreshed}
        coverageStart={data.metadata.coverageStart}
      />

      <ChartsSection
        momentumData={momentumData}
        functionCounts={allFunctionCounts}
        onFunctionClick={handleFunctionClick}
      />

      <div ref={feedRef}>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          regions={regions}
          companies={companies}
          institutions={institutions}
          resultCount={filtered.length}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <h2 className="text-xl font-serif italic text-ink">
            {timelineHeading(filters.timeline, filters.customDate)}
          </h2>
        </div>

        <DevelopmentGrid developments={filtered} />
      </div>

      <Footer />
    </main>
  );
}