import PageList from '@/components/pagelist';
import { Suspense } from 'react';
import { fetchPages } from '@/lib/notion';

export default async function CategoryPage({ params }: { params: { cate: string } }) {
    const pages = await fetchPages(params.cate);
  
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Category: {params.cate}</h1>
        <PageList pages={pages} />
      </div>
    );
}