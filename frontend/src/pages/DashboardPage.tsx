import { useState } from 'react';
import { Page, PageHeading, Card } from '../components/layout/Page';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui/Button';
import { StatCard, Spinner, Empty } from '../components/ui/index';
import { ShortenForm } from '../components/ShortenForm';
import { UrlRow } from '../components/UrlRow';
import { Pagination } from '../components/Pagination';
import { useUrls } from '../hooks/useUrls';
import { fmt } from '../utils/format';
import type { RouteProps } from '../types';

export function DashboardPage({ navigate }: RouteProps) {
  const [showModal, setShowModal] = useState(false);
  const { urls, total, page, loading, error, setPage, refresh } = useUrls(10);

  const totalClicks = urls.reduce((sum, u) => sum + (u.click_count || 0), 0);
  const activeCount = urls.filter(u => u.is_active).length;

  const handleNewLink = () => {
    setShowModal(false);
    refresh();
  };

  return (
    <Page wide>
      {/* Header row */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          marginBottom:   '2rem',
        }}
      >
        <PageHeading title="dashboard" subtitle="manage your shortened links" />
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + new link
        </Button>
      </div>

      {/* Stats */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:                 '12px',
          marginBottom:        '2rem',
        }}
      >
        <StatCard label="total links"  value={total} />
        <StatCard label="active"       value={activeCount} />
        <StatCard label="total clicks" value={fmt.number(totalClicks)} />
      </div>

      {/* URL list */}
      <Card padding="0 1.5rem">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</p>
          </div>
        ) : urls.length === 0 ? (
          <Empty
            message="no links yet"
            hint="create your first short link using the button above"
          />
        ) : (
          <>
            {/* Remove bottom border from last row */}
            <div style={{ '--last-border': 'none' } as React.CSSProperties}>
              {urls.map(url => (
                <UrlRow
                  key={url.id}
                  url={url}
                  onRefresh={refresh}
                  navigate={navigate}
                />
              ))}
            </div>

            <div style={{ paddingBottom: '0.5rem' }}>
              <Pagination
                page={page}
                total={total}
                limit={10}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* New link modal */}
      {showModal && (
        <Modal title="new short link" onClose={() => setShowModal(false)}>
          <ShortenForm extended onSuccess={handleNewLink} />
        </Modal>
      )}
    </Page>
  );
}