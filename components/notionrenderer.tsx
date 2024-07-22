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
    <blockquote className={`rounded-lg bg-zinc-100 p-6 dark:bg-zinc-800 border-l-4 border-blue-500 my-4 ${className}`}>
      <div className="relative text-lg font-medium md:flex-grow overflow-visible">
        <p className="relative px-2 italic" suppressHydrationWarning>
          {quote}
        </p>
      </div>
      {author && (
        <footer className="mt-2">
          <p className="text-base font-semibold text-zinc-600 dark:text-zinc-400" suppressHydrationWarning>
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

export const NotionBlockRenderer = ({ block }: Props) => {
  const { type, id } = block;
  const value = block[type];

  switch (type) {
    case 'paragraph':
      return (
        <p className="my-4 text-zinc-700 dark:text-zinc-300">
          <NotionText textItems={value.rich_text} />
        </p>
      );
    case 'heading_1':
      return (
        <h1 className="text-3xl font-bold mt-8 mb-4 text-zinc-900 dark:text-zinc-100">
          <NotionText textItems={value.rich_text} />
        </h1>
      );
    case 'heading_2':
      return (
        <h2 className="text-2xl font-semibold mt-6 mb-3 text-zinc-800 dark:text-zinc-200">
          <NotionText textItems={value.rich_text} />
        </h2>
      );
    case 'heading_3':
      return (
        <h3 className="text-xl font-medium mt-4 mb-2 text-zinc-800 dark:text-zinc-200">
          <NotionText textItems={value.rich_text} />
        </h3>
      );
    case 'bulleted_list':
      return (
        <ul className="list-disc pl-6 my-4 space-y-2 text-zinc-700 dark:text-zinc-300">
          {value.children.map((block: any) => (
            <NotionBlockRenderer key={block.id} block={block} />
          ))}
        </ul>
      );
    case 'numbered_list':
      return (
        <ol className="list-decimal pl-6 my-4 space-y-2 text-zinc-700 dark:text-zinc-300">
          {value.children.map((block: any) => (
            <NotionBlockRenderer key={block.id} block={block} />
          ))}
        </ol>
      );
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return (
        <li className="pl-2">
          <NotionText textItems={value.rich_text} />
          {!!value.children &&
            value.children.map((block: any) => (
              <NotionBlockRenderer key={block.id} block={block} />
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
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={id} className="text-zinc-700 dark:text-zinc-300">
            <NotionText textItems={value.rich_text} />
          </label>
        </div>
      );
    case 'toggle':
      return (
        <details className="my-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <summary className="cursor-pointer p-4 font-medium text-zinc-800 dark:text-zinc-200">
            <NotionText textItems={value.rich_text} />
          </summary>
          <div className="p-4 pt-0">
            {value.children?.map((block: any) => (
              <NotionBlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </details>
      );
    case 'child_page':
      return <p className="text-blue-600 hover:underline">{value.title}</p>;
    case 'image':
      const src = value.type === 'external' ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : '';
      return (
        <figure className="my-8">
          <Image
            className="rounded-lg object-cover w-full"
            placeholder="blur"
            src={src}
            alt={caption}
            blurDataURL={value.placeholder}
            width={value.size.width}
            height={value.size.height}
          />
          {caption && <figcaption className="text-center mt-2 text-sm text-zinc-500">{caption}</figcaption>}
        </figure>
      );
    case 'divider':
      return <hr key={id} className="my-8 border-zinc-200 dark:border-zinc-700" />;
    case 'quote':
      return <Quote key={id} quote={value.rich_text[0].plain_text} />;
    case 'code':
      return (
        <pre className={`language-${value.language} bg-zinc-800 text-zinc-100 rounded-lg p-4 my-4 overflow-x-auto`}>
          <code key={id}>{value.rich_text[0].plain_text}</code>
        </pre>
      );
    case 'file':
      const src_file = value.type === 'external' ? value.external.url : value.file.url;
      const splitSourceArray = src_file.split('/');
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1];
      const caption_file = value.caption ? value.caption[0]?.plain_text : '';
      return (
        <figure className="my-4">
          <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg">
            <span className="text-2xl">📎</span>
            <Link href={src_file} passHref className="text-blue-600 hover:underline">
              {lastElementInArray.split('?')[0]}
            </Link>
          </div>
          {caption_file && <figcaption className="mt-2 text-sm text-zinc-500">{caption_file}</figcaption>}
        </figure>
      );
    case 'bookmark':
      const href = value.url;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block my-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition duration-150">
          {href}
        </a>
      );
    default:
      return (
        <div className="my-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
          ❌ Unsupported block ({type === 'unsupported' ? 'unsupported by Notion API' : type})
        </div>
      );
  }
};

const NotionText = ({ textItems }: { textItems: TextRichTextItemResponse[] }) => {
  if (!textItems) {
    return null;
  }

  return (
    <>
      {textItems.map((textItem, index) => {
        const {
          annotations: { bold, code, color, italic, strikethrough, underline },
          text,
        } = textItem;
        return (
          <span
            key={index}
            style={color !== 'default' ? { color } : {}}
          >
            {text.link ? (
              <a href={text.link.url} className="text-blue-600 hover:underline">
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
