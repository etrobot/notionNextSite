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
          <li key={page.id} className="border-b border-gray-300 dark:opacity-88 dark:border-gray-600 last:border-b-0 py-4">
            <Link href={`/page/${page.id}`}>
              <p className="text-lg hover:opacity-75">
                {page.properties.Name.title[0]?.plain_text || 'Untitled'}
              </p>
            </Link>
            <span className="mt-1 text-sm text-muted-foreground">
              {formatDate(page.last_edited_time)}
            </span>
            {page.properties.Category?.select?.name && (
              <a className="p-1 ml-2 text-xs text-muted-foreground hover:underline" href={`/category/${encodeURIComponent(page.properties.Category.select.name)}`}>
                {page.properties.Category.select.name}
              </a>
            )}
          </li>
        ))}
      </ul>
    );
  }

export default PageList;
