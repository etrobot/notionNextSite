import { TextRichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

type QuoteProps = {
  className?: string;
  quote: string;
  author?: string;
};

const Quote = ({ className, quote, author }: QuoteProps) => {
  return (
    <blockquote className={`rounded-lg bg-slate-100 p-6 dark:bg-slate-800 border-l-4 border-blue-500 my-4 ${className}`}>
      <div className="relative text-lg font-medium md:flex-grow overflow-visible">
        <p className="relative px-2 italic" suppressHydrationWarning>
          {quote}
        </p>
      </div>
      {author && (
        <footer className="mt-2">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400" suppressHydrationWarning>
            — {author}
          </p>
        </footer>
      )}
    </blockquote>
  );
};

type Props = {
  block: any;
};

const NotionText = ({ textItems }: { textItems: TextRichTextItemResponse[] }) => {
  if (!textItems) return null;

  return (
    <>
      {textItems.map((textItem, index) => {
        const {
          annotations: { bold, code, color, italic, strikethrough, underline },
          text,
        } = textItem;

        // Conditional rendering based on annotations
        const style: React.CSSProperties = {};
        if (color !== 'default') style.color = color;
        if (bold) style.fontWeight = 'bold';
        if (italic) style.fontStyle = 'italic';
        if (underline) style.textDecoration = 'underline';
        if (strikethrough) style.textDecoration = 'line-through';
        if (code) style.fontFamily = 'monospace';

        return (
          <span key={index} style={style}>
            {text.link ? (
              <a href={text.link.url} className="text-blue-400 hover:underline">
                {text.content}
              </a>
            ) : (
              text.content
            )}
          </span>
        );
      })}
    </>
  );
};

export const NotionPageRenderer = ({ block }: Props) => {
  const { type, id } = block;
  const value = block[type];

  switch (type) {
    case 'paragraph':
      return (
        <p className="my-4 text-slate-700 dark:text-slate-300">
          <NotionText textItems={value.rich_text} />
        </p>
      );
    case 'heading_1':
      return (
        <h1 className="text-3xl font-bold mt-6 mb-4 text-slate-900 dark:text-slate-100">
          <NotionText textItems={value.rich_text} />
        </h1>
      );
    case 'heading_2':
      return (
        <h2 className="text-2xl font-semibold mt-6 mb-3 text-slate-800 dark:text-slate-200">
          <NotionText textItems={value.rich_text} />
        </h2>
      );
    case 'heading_3':
      return (
        <h3 className="text-xl font-medium mt-4 mb-2 text-slate-800 dark:text-slate-200">
          <NotionText textItems={value.rich_text} />
        </h3>
      );
    case 'bulleted_list':
      return (
        <ul className="list-disc pl-6 my-4 space-y-2 text-slate-700 dark:text-slate-300">
          {value.children.map((block: any) => (
            <NotionPageRenderer key={block.id} block={block} />
          ))}
        </ul>
      );
    case 'numbered_list':
      return (
        <ol className="list-decimal pl-6 my-4 space-y-2 text-slate-700 dark:text-slate-300">
          {value.children.map((block: any) => (
            <NotionPageRenderer key={block.id} block={block} />
          ))}
        </ol>
      );
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return (
        <li className="pl-2">
          <NotionText textItems={value.rich_text} />
          {value.children?.map((childBlock: any) => (
            <NotionPageRenderer key={childBlock.id} block={childBlock} />
          ))}
        </li>
      );
    case 'to_do':
      return (
        <div className="flex items-center space-x-2 my-2">
          <input
            type="checkbox"
            id={id}
            defaultChecked={value.checked}
            className="rounded border-gray-300 text-blue-400 focus:ring-blue-500"
          />
          <label htmlFor={id} className="text-slate-700 dark:text-slate-300">
            <NotionText textItems={value.rich_text} />
          </label>
        </div>
      );
    case 'toggle':
      return (
        <details className="my-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <summary className="cursor-pointer p-4 font-medium text-slate-800 dark:text-slate-200">
            <NotionText textItems={value.rich_text} />
          </summary>
          <div className="p-4 pt-0">
            {value.children?.map((childBlock: any) => (
              <NotionPageRenderer key={childBlock.id} block={childBlock} />
            ))}
          </div>
        </details>
      );
    case 'child_page':
      return <p className="text-blue-400 hover:underline">{value.title}</p>;
    case 'image':
      const src = value.type === 'external' ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : '';
      const width = value.size?.width || 800; // Default width
      const height = value.size?.height || 600; // Default height
      return (
        <figure className="my-8">
          <Image
            className="rounded-lg object-cover w-full"
            src={src}
            alt={caption}
            width={width}
            height={height}
          />
          {caption && <figcaption className="text-center mt-2 text-sm text-slate-500">{caption}</figcaption>}
        </figure>
      );
    case 'divider':
      return <hr key={id} className="my-8 border-slate-200 dark:border-slate-700" />;
    case 'quote':
      return <Quote key={id} quote={value.rich_text[0]?.plain_text || ''} />;
    case 'code':
      return (
        <pre className={`language-${value.language} bg-slate-800 text-slate-100 rounded-lg p-4 my-4 overflow-x-auto`}>
          <code key={id}>{value.rich_text[0]?.plain_text || ''}</code>
        </pre>
      );
    case 'file':
      const src_file = value.type === 'external' ? value.external.url : value.file.url;
      const splitSourceArray = src_file.split('/');
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1];
      const caption_file = value.caption ? value.caption[0]?.plain_text : '';
      return (
        <figure className="my-4">
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
            <span className="text-2xl">📎</span>
            <Link href={src_file} passHref className="text-blue-400 hover:underline">
              {lastElementInArray.split('?')[0]}
            </Link>
          </div>
          {caption_file && <figcaption className="mt-2 text-sm text-slate-500">{caption_file}</figcaption>}
        </figure>
      );
    case 'bookmark':
      const href = value.url;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block my-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-150">
          {href}
        </a>
      );
    case 'table':
      return (
        <div className="my-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-bold">
              {value.children.map((row: any, rowIndex: number) => (
                <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900'}>
                  {row[row.type].cells.map((cell: TextRichTextItemResponse[], cellIndex: number) => (
                    <td key={`${row.id}-${cellIndex}`} className="px-6 py-4 whitespace-nowrap text-sm">
                      <NotionText textItems={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'column_list':
      return (
        <div className="flex gap-1 my-4 space-y-4">
          {value.children.map((block: any) => (
            <div key={block.id} className="w-full">
              <NotionPageRenderer block={block} />
            </div>
          ))}
        </div>
      );
    case 'column':
      return (
        <div>
          {value.children.map((block: any) => (
            <NotionPageRenderer key={block.id} block={block} />
          ))}
        </div>
      );
      case 'child_database':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {value.content.map((childBlock: any) => {
              const { id, cover, properties, url, public_url } = childBlock;
              const title = properties.Name.title.length > 0
                ? properties.Name.title[0].plain_text
                : 'Untitled';
              const createdTime = new Date(properties.Created.created_time).toLocaleDateString();
              const coverUrl = cover?.[cover.type]?.url || null;
              const linkUrl = public_url || url;
      
              return (
                <div key={id} className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
                  <div className="relative w-full" style={{ paddingBottom: '75%' }}> {/* Aspect ratio 4:3 */}
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                        width={320}
                        height={240}
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700" />
                    )}
                  </div>
                  <div className="p-2 flex flex-col h-full">
                    <div className="flex-grow overflow-hidden">
                        <h3 className="font-bold mb-2 line-clamp-3">
                          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                            {title}
                          </a>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                        {createdTime}
                      </p>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        );
      
    default:
      return (
        <div className="my-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
          ❌ Unsupported block ({type === 'unsupported' ? 'unsupported by Notion API' : type})
        </div>
      );
  }
};
