import { notFound } from 'next/navigation';
import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { notesApi } from '@/lib/notion';
import { NotionBlockRenderer } from '@/components/notionrenderer';

type Props = {
  params: {
    id: string;
  };
};


export default async function NotePage({ params }: Props) {
  const { id } = params;
  const allNotes = await notesApi.getNotes();
  const note = allNotes.find((note) => note.id === id);

  if (!note) {
    notFound();
  }

  const noteContent: BlockObjectResponse[] = await notesApi.getNote(note.id);

  return (
    <div className='mx-auto max-w-2xl'>
      {noteContent.map((block:BlockObjectResponse) => (
        <NotionBlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}