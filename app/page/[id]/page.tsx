import { notFound } from 'next/navigation';
import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { notesApi } from '@/lib/notion';
import { NotionBlockRenderer } from '@/components/notionrenderer';

type Props = {
  params: {
    id: string;
  };
};

async function fetchNoteContent(id: string) {
  const allNotes = await notesApi.getNotes();
  const note = allNotes.find((note) => note.id === id);

  if (!note) {
    return null;
  }

  const noteContent: BlockObjectResponse[] = await notesApi.getNote(note.id);
  return noteContent;
}

export default async function NotePage({ params }: Props) {
  const { id } = params;
  const noteContent = await fetchNoteContent(id);

  if (!noteContent) {
    notFound();
  }

  return (
    <div className='mx-auto max-w-2xl'>
      {noteContent.map((block: BlockObjectResponse) => {
        // Ensure that block.id is always defined and unique
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

