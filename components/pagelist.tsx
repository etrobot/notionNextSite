// components/PageList.tsx
import Link from 'next/link';

function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function PageList({ pages }: { pages: any[] }) {
    return (
      <ul>
        {pages.map((page) => (
          <li key={page.id} className="border-b border-gray-200 last:border-b-0 py-4">
            <Link href={`/page/${page.id}`}>
              <span className="text-lg font-semibold hover:text-blue-800">
                {page.properties.Name.title[0]?.plain_text || 'Untitled'}
              </span>
            </Link>
            <div className="mt-1 text-sm text-gray-500">
              {formatDate(page.last_edited_time)}
            </div>
          </li>
        ))}
      </ul>
    );
  }

export default PageList;
