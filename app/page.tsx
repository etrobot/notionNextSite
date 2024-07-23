import PageList from '@/components/pagelist';
import { Suspense } from 'react';
import { notesApi } from '@/lib/notion';

export default async function HomePage({ searchParams }: { searchParams: { yr?: string } }) {
  const year = searchParams.yr ? parseInt(searchParams.yr, 10) : undefined;
  const pages = await notesApi.getNotes('descending', undefined, year);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Notion Database</h1>
        <PageList pages={pages} />
      </div>
    </Suspense>
  );
}