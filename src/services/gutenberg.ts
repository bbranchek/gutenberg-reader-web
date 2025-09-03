interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{
    name: string;
    birth_year?: number;
    death_year?: number;
  }>;
  subjects: string[];
  download_count: number;
  formats: Record<string, string>;
}

interface GutenbergResponse {
  count: number;
  results: GutenbergBook[];
}

export interface Book {
  id: number;
  title: string;
  author: string;
  downloadCount: number;
  textUrl?: string;
  htmlUrl?: string;
}

export class GutenbergService {
  private static readonly BASE_URL = 'https://gutendex.com/books';
  
  static async searchBooks(query: string, limit: number = 10): Promise<Book[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}?search=${encodeURIComponent(query)}&page_size=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search books');
      }
      
      const data: GutenbergResponse = await response.json();
      
      return data.results.map(book => ({
        id: book.id,
        title: book.title,
        author: book.authors.length > 0 ? book.authors[0].name : 'Unknown Author',
        downloadCount: book.download_count,
        textUrl: book.formats['text/plain'] || book.formats['text/plain; charset=utf-8'],
        htmlUrl: book.formats['text/html']
      }));
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  }
  
  static async getBookText(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch book content');
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching book text:', error);
      throw error;
    }
  }
}