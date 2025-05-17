import { notFound } from 'next/navigation';
import { BlockObjectResponse, PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { notionapi } from '@/lib/notion';
import { NotionPageRenderer } from '@/components/notionrenderer';
import { unstable_cache } from 'next/cache';

type Props = {
  params: {
    id: string;
  };
};

interface ExtendedPageObjectResponse extends Omit<PageObjectResponse, 'properties'> {
  properties: {
    Name: {
      id: string;
      type: 'title';
      title: Array<RichTextItemResponse>;
    };
    [key: string]: {
      id: string;
      type: string;
      [key: string]: any;
    };
  };
}

// 使用 unstable_cache 包装页面数据获取
const getCachedPageData = unstable_cache(
  async (id: string) => {
    console.log('[Page] Fetching page data for:', id);
    const startTime = Date.now();
    const page = await notionapi.getPage(id);
    if (!page) return null;

    const typedPage = page.page as ExtendedPageObjectResponse;
    const pageData = {
      id,
      pageTitle: typedPage.properties.Name.title[0]?.plain_text,
      createdat: typedPage.created_time,
      category: typedPage.properties.Category?.select?.name,
      noteContent: page.content as BlockObjectResponse[],
    };
    console.log(`[Page] Fetched page data in ${Date.now() - startTime}ms`);
    return pageData;
  },
  ['page-data-cache'],
  {
    revalidate: 300, // 5分钟，因为文章内容需要较快更新
    tags: ['page-data']
  }
);

// 博客详情页面缓存时间设置为5分钟
export const revalidate = 300;

export default async function NotePage({ params }: Props) {
  const { id } = params;
  const pageData = await getCachedPageData(id);
  
  if (!pageData || !pageData.noteContent) {
    notFound();
  }

  const { pageTitle, createdat, category, noteContent } = pageData;

  return (
    <div className='p-4 max-w-6xl mt-14 mx-auto'>
      <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
      <h6 className="text-xs text-muted-foreground mb-4">{createdat.slice(0, 10)} {category}</h6>
      {noteContent.map((block: BlockObjectResponse,index: number) => {
        return (
          <NotionPageRenderer key={block.id?block.id:index} block={block} />
        );
      })}
    </div>
  );
}
