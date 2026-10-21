import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  renderMobileCard?: (item: T) => React.ReactNode;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterOptions?: { label: string; value: string; filterFn: (item: T) => boolean }[];
  pageSize?: number;
  emptyMessage?: string;
  isMobile?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  searchPlaceholder = 'Search records...',
  searchFilter,
  filterOptions,
  pageSize = 10,
  emptyMessage = 'No records found.',
  isMobile = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterIndex, setActiveFilterIndex] = useState<number>(-1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered Data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Category / Custom filter
    if (activeFilterIndex >= 0 && filterOptions && filterOptions[activeFilterIndex]) {
      result = result.filter(filterOptions[activeFilterIndex].filterFn);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (searchFilter) {
        result = result.filter(item => searchFilter(item, q));
      } else {
        result = result.filter(item => {
          return Object.values(item as Record<string, unknown>).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
          });
        });
      }
    }

    // Sorting
    if (sortKey) {
      result.sort((a, b) => {
        const valA = (a as Record<string, unknown>)[sortKey];
        const valB = (b as Record<string, unknown>)[sortKey];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        return sortDirection === 'asc' ? 1 : -1;
      });
    }

    return result;
  }, [data, searchQuery, searchFilter, activeFilterIndex, filterOptions, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Controls: Search and Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search Input */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-button)',
            padding: '6px 12px',
            minWidth: '240px',
            flex: '1 1 240px',
            maxWidth: '400px',
          }}
        >
          <Search size={16} color="var(--mute)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--ink)',
              fontSize: 'var(--font-sm)',
              width: '100%',
            }}
          />
        </div>

        {/* Filter Pills */}
        {filterOptions && filterOptions.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveFilterIndex(-1);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-tag)',
                fontSize: 'var(--font-xs)',
                fontWeight: activeFilterIndex === -1 ? 700 : 500,
                backgroundColor: activeFilterIndex === -1 ? 'var(--pri)' : 'var(--card)',
                color: activeFilterIndex === -1 ? '#FFFFFF' : 'var(--ink)',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                minHeight: '32px',
              }}
            >
              All ({data.length})
            </button>
            {filterOptions.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setActiveFilterIndex(idx);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-tag)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: activeFilterIndex === idx ? 700 : 500,
                  backgroundColor: activeFilterIndex === idx ? 'var(--pri)' : 'var(--card)',
                  color: activeFilterIndex === idx ? '#FFFFFF' : 'var(--ink)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                  minHeight: '32px',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Card Fallback */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginatedData.length === 0 ? (
            <Card padding="md">
              <p style={{ textAlign: 'center', color: 'var(--mute)', fontSize: 'var(--font-sm)' }}>
                {emptyMessage}
              </p>
            </Card>
          ) : (
            paginatedData.map(item => (
              <React.Fragment key={keyExtractor(item)}>
                {renderMobileCard ? (
                  renderMobileCard(item)
                ) : (
                  <Card padding="md">
                    {columns.map(col => (
                      <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--font-sm)' }}>
                        <span style={{ color: 'var(--mute)' }}>{col.header}:</span>
                        <span style={{ fontWeight: 500 }}>
                          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                        </span>
                      </div>
                    ))}
                  </Card>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      ) : (
        /* Desktop Table */
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--soft)', borderBottom: '1px solid var(--line)' }}>
                {columns.map(col => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key, col.sortable)}
                      style={{
                        padding: '12px 16px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        cursor: col.sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        width: col.width,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span style={{ color: isSorted ? 'var(--pri)' : 'var(--mute)', display: 'inline-flex' }}>
                            {isSorted ? (
                              sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            ) : (
                              <ChevronsUpDown size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--mute)' }}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map(item => (
                  <tr
                    key={keyExtractor(item)}
                    style={{
                      borderBottom: '1px solid var(--line)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--soft)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: '12px 16px', color: 'var(--ink)' }}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} records
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              icon={<ChevronLeft size={14} />}
            >
              Prev
            </Button>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', fontWeight: 600, color: 'var(--ink)' }}>
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              icon={<ChevronRight size={14} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
