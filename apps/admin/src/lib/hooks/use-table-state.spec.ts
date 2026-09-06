import { act, renderHook } from '@testing-library/react';
import { useTableState } from './use-table-state';

describe('useTableState', () => {
  it('starts on page 1 with no sort', () => {
    const { result } = renderHook(() => useTableState());
    expect(result.current.page).toBe(1);
    expect(result.current.sort).toBeUndefined();
    expect(result.current.sortParam).toBeUndefined();
  });

  it('cycles a column through asc -> desc -> unsorted', () => {
    const { result } = renderHook(() => useTableState());

    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ field: 'name', direction: 'asc' });
    expect(result.current.sortParam).toBe('name:asc');

    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ field: 'name', direction: 'desc' });

    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toBeUndefined();
  });

  it('switching sort column resets to ascending', () => {
    const { result } = renderHook(() => useTableState());
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('sku'));
    expect(result.current.sort).toEqual({ field: 'sku', direction: 'asc' });
  });

  it('resets the page when search or limit changes', () => {
    const { result } = renderHook(() => useTableState());
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    act(() => result.current.setSearch('shirt'));
    expect(result.current.page).toBe(1);
    expect(result.current.search).toBe('shirt');

    act(() => result.current.setPage(2));
    act(() => result.current.setLimit(50));
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(50);
  });
});
