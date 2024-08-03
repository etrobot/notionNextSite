import { notFound } from 'next/navigation';
import { BlockObjectResponse, PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { notionapi } from '@/lib/notion';
import { NotionPageRenderer } from '@/components/notionrenderer';

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

// Fetch the page data
async function fetchPageData(id: string) {
  const page = await notionapi.getPage(id);
  if (!page) return null;

  const typedPage = page.page as ExtendedPageObjectResponse;
  return {
    id,
    pageTitle: typedPage.properties.Name.title[0]?.plain_text,
    createdat: typedPage.created_time,
    category: typedPage.properties.Category?.select?.name,
    noteContent: page.content as BlockObjectResponse[],
  };
}

// Revalidate this page every 60 seconds
export const revalidate = 60;

export default async function NotePage({ params }: Props) {
  const { id } = params;
  const pageData = await fetchPageData(id);
  
  if (!pageData || !pageData.noteContent) {
    notFound();
  }

  const { pageTitle, createdat, category, noteContent } = pageData;

  return (
    <div className='p-4'>
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
