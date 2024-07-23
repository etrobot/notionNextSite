import PageList from '@/components/pagelist';
import { Suspense } from 'react';
import { notesApi } from '@/lib/notion';

export default async function CategoryPage({ params }: { params: { cate: string } }) {
    const pages = await notesApi.getNotes('descending', params.cate);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Category: {params.cate}</h1>
        <PageList pages={pages} />
      </div>
    );
}