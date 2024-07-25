import PageList from '@/components/pagelist';
import { Suspense } from 'react';
import { notionapi } from '@/lib/notion';

// Fetch the notes data
async function fetchNotes(year?: number) {
  return await notionapi.getPages('descending', undefined, year);
}

// Revalidate this page every 60 seconds
export const revalidate = 60;

export default async function HomePage({ searchParams }: { searchParams: { yr?: string } }) {
  const year = searchParams.yr ? parseInt(searchParams.yr, 10) : undefined;
  const pages = await fetchNotes(year);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto p-4 mt-6">
        <h1 className="text-3xl font-bold mb-2">Notion Database</h1>
        <PageList pages={pages} />
      </div>
    </Suspense>
  );
}
