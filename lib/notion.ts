import { Client } from '@notionhq/client';
import { BlockObjectResponse, PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const databaseId = process.env.NOTION_DATABASE_ID ?? '';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

class NotionApi {
  constructor(
    private readonly notion: Client,
    private readonly databaseId: string,
  ) {}

  async fetchCategories() {
    try {
      const database = await this.notion.databases.retrieve({ database_id: this.databaseId });
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

    const filters: any[] = [];

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

  private async getPage(pageId: string) {
    const page = await this.notion.pages.retrieve({ page_id: pageId });
    const blocks = await this.getBlocks(pageId);

    return {
      page,
      content: blocks,
    };
  }

  private async getBlocks(blockId: string): Promise<BlockObjectResponse[]> {
    const blocks: BlockObjectResponse[] = [];
    let cursor = undefined;

    do {
      const { results, next_cursor } = await this.notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
      });

      const validResults = results.filter((result): result is BlockObjectResponse => 
        result.object === 'block'
      );

      for (const block of validResults) {
        if (block.has_children) {
          const children = await this.getBlocks(block.id);
          (block as any)[block.type].children = children;
        }
        blocks.push(block);
      }

      cursor = next_cursor;
    } while (cursor);

    return blocks;
  }
}

export const notionapi = new NotionApi(notion, databaseId);
