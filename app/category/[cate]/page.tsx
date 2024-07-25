import PageList from '@/components/pagelist';
import { notionapi } from '@/lib/notion';

export const revalidate = 60; // 启用ISR并设置页面每60秒重新生成一次

export default async function CategoryPage({ params }: { params: { cate: string } }) {
  const pages = await notionapi.getPages('descending', params.cate);
  
  return (
    <div className="container mx-auto p-4 mt-6">
      <h1 className="text-3xl font-bold mb-6">Category: {params.cate}</h1>
      <PageList pages={pages} />
    </div>
  );
}
