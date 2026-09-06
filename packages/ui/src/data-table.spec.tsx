import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type DataTableColumn } from './data-table';

interface Row {
  id: string;
  name: string;
}

const columns: Array<DataTableColumn<Row>> = [
  { key: 'name', header: 'Name', sortable: true, render: (row) => row.name },
];

describe('DataTable', () => {
  it('renders skeleton rows while loading', () => {
    const { container } = render(
      <DataTable columns={columns} rows={[]} rowKey={(row) => row.id} isLoading skeletonRows={3} />,
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('renders the empty state when there are no rows', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        emptyTitle="No items yet"
        emptyDescription="Add one to get started."
      />,
    );
    expect(screen.getByText('No items yet')).toBeInTheDocument();
    expect(screen.getByText('Add one to get started.')).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<DataTable columns={columns} rows={[{ id: '1', name: 'Widget' }]} rowKey={(row) => row.id} />);
    expect(screen.getByText('Widget')).toBeInTheDocument();
  });

  it('calls onSortChange when a sortable header is clicked', () => {
    const onSortChange = jest.fn();
    render(
      <DataTable columns={columns} rows={[]} rowKey={(row) => row.id} onSortChange={onSortChange} />,
    );
    fireEvent.click(screen.getByText('Name'));
    expect(onSortChange).toHaveBeenCalledWith('name');
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = jest.fn();
    render(
      <DataTable
        columns={columns}
        rows={[{ id: '1', name: 'Widget' }]}
        rowKey={(row) => row.id}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText('Widget'));
    expect(onRowClick).toHaveBeenCalledWith({ id: '1', name: 'Widget' });
  });
});
