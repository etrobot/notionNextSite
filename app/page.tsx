import { Client } from '@notionhq/client';
import Link from 'next/link';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID ?? ''; // 替换为你的数据库ID

export default async function HomePage() {
  // 获取数据库内容
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  const pages = response.results;

  return (
    <div>
      <h1>Notion Database</h1>
      <ul>
        {pages.map((page: any) => (
          <li key={page.id}>
            <Link href={`/page/${page.id}`}>
              {page.properties.Name.title[0].plain_text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
