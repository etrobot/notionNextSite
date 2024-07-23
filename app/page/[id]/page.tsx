import { notFound } from 'next/navigation';
import { BlockObjectResponse, PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { notesApi } from '@/lib/notion';
import { NotionBlockRenderer } from '@/components/notionrenderer';

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

export default async function NotePage({ params }: Props) {
  const { id } = params;
  const page = await notesApi.getPage(id);
  
  // Type assertion
  const typedPage = page.page as ExtendedPageObjectResponse;
  console.log(typedPage);
  const pageTitle = typedPage.properties.Name.title[0]?.plain_text;
  const createdat = typedPage.created_time;
  const category = typedPage.properties.Category?.select?.name;
  const noteContent: BlockObjectResponse[] = page.content;
  
  if (!noteContent) {
    notFound();
  }

  return (
    <div className='p-4'>
      <h1 className="text-3xl font-bold my-6">{pageTitle}</h1>
      <h6 className="text-xs text-muted-foreground">{createdat.slice(0, 10)} {category}</h6>
      {noteContent.map((block: BlockObjectResponse) => {
        if (!block.id) {
          console.error('Block ID is missing or undefined', block);
          return null;
        }
        return (
          <NotionBlockRenderer key={block.id} block={block} />
        );
      })}
    </div>
  );
}