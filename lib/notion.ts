import { Client, isFullPage } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { getPlaiceholder } from 'plaiceholder';

const databaseId = process.env.NOTION_DATABASE_ID ?? '';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});


const noop = async (block: BlockObjectResponse) => block;

/**
 * Union type of all block types
 * @see https://developers.notion.com/reference/block
 */
type BlockType = BlockObjectResponse['type'];

/**
 * Lookup table for transforming block types
 * Allows to transform an api response for a specific block type into a more usable format
 */
const BlockTypeTransformLookup: Record<
  BlockType,
  (block: BlockObjectResponse) => Promise<BlockObjectResponse>
> = {
  file: noop,
  paragraph: noop,
  heading_1: noop,
  heading_2: noop,
  heading_3: noop,
  bulleted_list_item: noop,
  numbered_list_item: noop,
  quote: noop,
  to_do: noop,
  toggle: noop,
  template: noop,
  synced_block: noop,
  child_page: noop,
  child_database: noop,
  equation: noop,
  code: noop,
  callout: noop,
  divider: noop,
  breadcrumb: noop,
  table_of_contents: noop,
  column_list: noop,
  column: noop,
  link_to_page: noop,
  table: noop,
  table_row: noop,
  embed: noop,
  bookmark: noop,
  image: async (block: any) => {
    const contents = block[block.type];
    const buffer = await fetch(contents[contents.type].url).then(async (res) =>
      Buffer.from(await res.arrayBuffer()),
    );
    const {
      base64,
      metadata: { height, width },
    } = await getPlaiceholder(buffer, { size: 64 });
    block.image['size'] = { height, width };
    block.image['placeholder'] = base64;

    return block;
  },
  video: noop,
  pdf: noop,
  audio: noop,
  link_preview: noop,
  unsupported: noop,
};

class NotesApi {
  constructor(
    private readonly notion: Client,
    private readonly databaseId: string,
  ) {}

  async getNotes(sortOrder: 'ascending' | 'descending' = 'descending', categoryId?: string, year?: number, limit?: number) {
    const currentYear = new Date().getFullYear();
    const startYear = year ? currentYear - (year - 1) : currentYear - 1;
    const startDate = new Date(`${startYear}-01-01`).toISOString();
    const endDate = new Date(`${startYear + 1}-12-31`).toISOString();

    const filters = [];

    if (categoryId) {
      filters.push({
        property: 'Category',
        select: {
          equals: categoryId,
        },
      });
    }

    filters.push({
      property: 'Last edited time',
      date: {
        on_or_after: startDate,
        on_or_before: endDate,
      },
    });

    const response = await this.notion.databases.query({
      database_id: this.databaseId,
      filter: {
        and: filters,
      },
      sorts: [
        {
          property: 'Last edited time',
          direction: sortOrder,
        },
      ],
      page_size: limit,
    });

    return response.results;
  }

  async getPage(pageId: string) {
    const page = await this.notion.pages.retrieve({ page_id: pageId });
    const blocks = await this.getBlocks(pageId);
    const blocksChildren = await Promise.all(
      blocks.map(async (block) => {
        const { id } = block;
        const contents = block[block.type as keyof typeof block] as any;
        if (!['unsupported', 'child_page'].includes(block.type) && block.has_children) {
          contents.children = await this.getBlocks(id);
        }

        return block;
      }),
    );

    const transformedBlocks = await Promise.all(
      blocksChildren.map(async (block) => {
        return BlockTypeTransformLookup[block.type as BlockType](block);
      }),
    );

    const structuredBlocks = transformedBlocks.reduce((acc: any, curr) => {
      if (curr.type === 'bulleted_list_item') {
        if (acc[acc.length - 1]?.type === 'bulleted_list') {
          acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
        } else {
          acc.push({
            type: 'bulleted_list',
            bulleted_list: { children: [curr] },
          });
        }
      } else if (curr.type === 'numbered_list_item') {
        if (acc[acc.length - 1]?.type === 'numbered_list') {
          acc[acc.length - 1][acc[acc.length - 1].type].children?.push(curr);
        } else {
          acc.push({
            type: 'numbered_list',
            numbered_list: { children: [curr] },
          });
        }
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    return {
      page,
      content: structuredBlocks,
    };
  }

  private getBlocks = async (blockId: string) => {
    const list = await this.notion.blocks.children.list({
      block_id: blockId,
    });

    while (list.has_more && list.next_cursor) {
      const { results, has_more, next_cursor } = await this.notion.blocks.children.list({
        block_id: blockId,
        start_cursor: list.next_cursor,
      });
      list.results = list.results.concat(results);
      list.has_more = has_more;
      list.next_cursor = next_cursor;
    }

    return list.results as BlockObjectResponse[];
  };
}

export const notesApi = new NotesApi(notion, process.env.NOTION_DATABASE_ID!);
