import { Client, isFullPage } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

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

    const structuredBlocks = blocksChildren.reduce((acc: any, curr) => {
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

export const notionapi = new notionApi(notion, process.env.NOTION_DATABASE_ID!);
