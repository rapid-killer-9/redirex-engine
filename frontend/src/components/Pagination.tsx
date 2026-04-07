import { Button } from './ui/Button';

interface PaginationProps {
  page:    number;
  total:   number;
  limit:   number;
  onChange:(page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '10px',
        paddingTop:     '1.5rem',
      }}
    >
      <Button size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        ← prev
      </Button>
      <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>
        {page} / {totalPages}
      </span>
      <Button size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        next →
      </Button>
    </div>
  );
}