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
  ) { }

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

  async getLastStatusOptions() {
    try {
      const database = await this.notion.databases.retrieve({ database_id: this.databaseId });
      const statusProperty = database.properties.Status;

      if (statusProperty.type === 'status') {
        return statusProperty.status.options;
      }

      return [];
    } catch (error) {
      console.error('Error fetching status options from Notion:', error);
      return [];
    }
  }

  async getPages(
    sortOrder: 'ascending' | 'descending' = 'descending',
    categoryId?: string,
    year?: number,
    limit?: number,
    status?: string
  ) {
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

    if (!status) {
      const lastStatusOptions = await this.getLastStatusOptions();
      if (lastStatusOptions.length > 0) {
        status = lastStatusOptions.slice(-1)[0].name;
      }
    }

    if (status) {
      filters.push({
        property: 'Status',
        status: {
          equals: status,
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
    console.log(page)
    const blocks = await this.getBlocks(pageId);
    console.log(blocks)
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

      console.log(results)

      for (const block of validResults) {
        if (block.type === 'child_database') {
          const childDatabaseContents = await this.queryChildDatabase(block.id);
          (block as any).child_database.content = childDatabaseContents;
        }

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

  private async queryChildDatabase(databaseId: string) {
    try {
      const response = await this.notion.databases.query({
        database_id: databaseId,
      });
      return response.results;
    } catch (error) {
      console.error('Error querying child database:', error);
      return [];
    }
  }
}

export const notionapi = new NotionApi(notion, databaseId);
