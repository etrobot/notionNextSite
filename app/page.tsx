import PageList from '@/components/pagelist';
import { Suspense } from 'react';
import { fetchPages } from '@/lib/notion';

export default async function HomePage() {
  const pages = await fetchPages();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Notion Database</h1>
        <PageList pages={pages} />
      </div>
    </Suspense>
  );
}