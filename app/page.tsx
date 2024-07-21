'use client';
import { Client } from '@notionhq/client';
import Link from 'next/link';
import { Suspense } from 'react'

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID ?? ''; // 替换为你的数据库ID

export default async function HomePage() {
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  const pages = response.results;

  return (
    <Suspense>
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Notion Database</h1>
      <ul>
        {pages.map((page: any) => (
          <li key={page.id} className="border-b border-gray-200 last:border-b-0">
            <Link href={`/page/${page.id}`}>
              <span className="text-lg  hover:text-blue-800">
                {page.properties.Name.title[0].plain_text}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
    </Suspense>
  );
}