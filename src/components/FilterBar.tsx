'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import {
  Filters,
  TimelinePreset,
  FunctionCategory,
  RDType,
  ALL_FUNCTIONS,
  ALL_RD_TYPES,
} from '@/lib/types';
import { ChevronDown, X, Search } from 'lucide-react';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  regions: string[];
  companies: string[];
  institutions: string[];
  resultCount: number;
}

const TIMELINE_OPTIONS: { value: TimelinePreset; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '12months', label: 'Last 12 Mo.' },
  { value: '2years', label: 'Last 2 Years' },
  { value: 'all', label: 'All Time' },
];

function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: T[];
  selected: Set<T>;
  onChange: (selected: Set<T>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allSelected = selected.size === 0 || selected.size === options.length;
  const countLabel = allSelected ? `${options.length}/${options.length}` : `${selected.size}/${options.length}`;

  const toggle = (opt: T) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(next);
  };

  const selectAll = () => onChange(new Set());

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors min-w-[140px]"
      >
        <span className="text-muted">{label}</span>
        <span className="font-bold text-ink">{countLabel}</span>
        <ChevronDown className="w-3 h-3 ml-auto text-muted" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 w-72 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2 pb-2 border-b">
            <span className="text-xs font-semibold text-ink">{label}</span>
            <button onClick={selectAll} className="text-[10px] text-accent-blue hover:underline">
              Select all
            </button>
          </div>
          <div className="space-y-1">
            {options.map((opt) => {
              const isActive = selected.size === 0 || selected.has(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggle(opt)}
                    className="rounded border-gray-300 text-accent-blue focus:ring-accent-blue"
                  />
                  <span className="text-xs text-ink">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  filters,
  onChange,
  regions,
  companies,
  institutions,
  resultCount,
}: FilterBarProps) {
  const update = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  const activeFilterCount =
    (filters.functions.size > 0 ? 1 : 0) +
    (filters.regions.size > 0 ? 1 : 0) +
    (filters.companies.size > 0 ? 1 : 0) +
    (filters.institutions.size > 0 ? 1 : 0) +
    (filters.rdTypes.size > 0 ? 1 : 0) +
    (filters.search ? 1 : 0);

  const clearAll = () =>
    onChange({
      ...filters,
      functions: new Set(),
      regions: new Set(),
      companies: new Set(),
      institutions: new Set(),
      rdTypes: new Set(),
      search: '',
      customDate: undefined,
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {TIMELINE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update({ timeline: value, customDate: undefined })}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              filters.timeline === value && !filters.customDate
                ? 'bg-ink text-white'
                : 'bg-white/70 text-ink hover:bg-white border border-gray-200/80'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <MultiSelectDropdown<FunctionCategory>
          label="Function"
          options={ALL_FUNCTIONS}
          selected={filters.functions}
          onChange={(functions) => update({ functions })}
        />
        <MultiSelectDropdown
          label="Region"
          options={regions}
          selected={filters.regions}
          onChange={(regions) => update({ regions })}
        />
        <MultiSelectDropdown
          label="Company / Co-op"
          options={companies}
          selected={filters.companies}
          onChange={(companies) => update({ companies })}
        />
        <MultiSelectDropdown
          label="Institution"
          options={institutions}
          selected={filters.institutions}
          onChange={(institutions) => update({ institutions })}
        />
        <MultiSelectDropdown<RDType>
          label="R&D Type"
          options={ALL_RD_TYPES}
          selected={filters.rdTypes}
          onChange={(rdTypes) => update({ rdTypes })}
        />

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search developments..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            Clear ({activeFilterCount})
          </button>
        )}

        <span className="ml-auto text-xs text-muted font-medium">{resultCount} results</span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-muted uppercase tracking-[0.14em]">Or pick a day</span>
        <input
          type="date"
          value={filters.customDate ?? ''}
          onChange={(e) =>
            update({ customDate: e.target.value || undefined, timeline: 'all' })
          }
          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white/80"
        />
      </div>
    </div>
  );
}
