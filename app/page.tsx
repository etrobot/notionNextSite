import PageList from '@/components/pagelist';
import { Suspense } from 'react';
import { notionapi } from '@/lib/notion';
import { unstable_cache } from 'next/cache';

// 使用 unstable_cache 包装 fetchNotes 函数以提供更细粒度的缓存控制
const getCachedNotes = unstable_cache(
  async (year?: number) => {
    console.log('[Blog] Fetching notes with year:', year);
    const startTime = Date.now();
    const pages = await notionapi.getPages('descending', undefined, year);
    console.log(`[Blog] Fetched notes in ${Date.now() - startTime}ms`);
    return pages;
  },
  ['notes-cache'],
  {
    revalidate: 3600, // 调整为1小时
    tags: ['notes']
  }
);

// 博客列表页面（访问频繁，但内容相对稳定）
export const revalidate = 3600; // 1小时

export default async function HomePage({ searchParams }: { searchParams: { yr?: string } }) {
  const year = searchParams.yr ? parseInt(searchParams.yr, 10) : undefined;
  const pages = await getCachedNotes(year);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto p-4 mt-6">
        <h1 className="text-3xl font-bold mb-2">{process.env.TITLE ?? 'Notion Database'}</h1>
        <PageList pages={pages} />
      </div>
    </Suspense>
  );
}
