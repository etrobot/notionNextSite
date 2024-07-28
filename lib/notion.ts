import { Client } from '@notionhq/client';
import { BlockObjectResponse, PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const databaseId = process.env.NOTION_DATABASE_ID ?? '';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

class notionApi {
  constructor(
    private readonly notion: Client,
    private readonly databaseId: string,
  ) {}

  async fetchCategories() {
    try {
      const database = await this.notion.databases.retrieve({ database_id: databaseId });
      const categoryProperty = database.properties.Category;

      if (categoryProperty.type === 'select') {
        return categoryProperty.select.options;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching categories from Notion:', error);
      return [];
    }
  }

  async getPages(sortOrder: 'ascending' | 'descending' = 'descending', categoryId?: string, year?: number, limit?: number) {
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

    const structuredBlocks = await Promise.all(
      blocks.map(async (block) => {
        if (block.has_children && isBlockWithChildren(block)) {
          console.log(block);
          const blockWithChildren = block as BlockWithChildren;
          blockWithChildren[block.type].children = await this.getBlocks(block.id);
        }
        return block;
      })
    );

    return {
      page,
      content: structuredBlocks,
    };
  }

  private getBlocks = async (blockId: string) => {
    let blocks: BlockObjectResponse[] = [];
    let cursor = undefined;

    do {
      const { results, next_cursor } = await this.notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
      });

      // Filter out PartialBlockObjectResponse and keep only BlockObjectResponse
      const validResults = results.filter((result): result is BlockObjectResponse => 
        result.object === 'block'
      );

      blocks = blocks.concat(validResults);
      cursor = next_cursor;
    } while (cursor);

    return blocks;
  };
}

// Define the type for blocks with children
type BlockWithChildren = BlockObjectResponse & {
  [key: string]: any;
}

// Type guard to check if a block can have children
function isBlockWithChildren(block: BlockObjectResponse): block is BlockWithChildren {
  return block.has_children;
}

export const notionapi = new notionApi(notion, databaseId);
