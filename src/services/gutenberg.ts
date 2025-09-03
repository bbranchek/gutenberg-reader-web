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
      
      // Remove duplicates and filter for readable books
      const uniqueBooks = new Map();
      
      data.results.forEach(book => {
        // Look for various text formats in order of preference
        const textUrl = book.formats['text/plain'] || 
                       book.formats['text/plain; charset=utf-8'] || 
                       book.formats['text/plain; charset=us-ascii'] ||
                       book.formats['application/plain'];
        
        if (textUrl && !uniqueBooks.has(book.title.toLowerCase())) {
          uniqueBooks.set(book.title.toLowerCase(), {
            id: book.id,
            title: book.title,
            author: book.authors.length > 0 ? book.authors[0].name : 'Unknown Author',
            downloadCount: book.download_count,
            textUrl: textUrl,
            htmlUrl: book.formats['text/html']
          });
        }
      });
      
      return Array.from(uniqueBooks.values());
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  }
  
  static async getBookText(url: string): Promise<string> {
    try {
      // Use a CORS proxy to fetch the content
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const targetUrl = encodeURIComponent(url);
      const proxyUrl = corsProxy + targetUrl;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain,text/html,*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch book content: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      
      // Clean up the text content and remove Project Gutenberg header/footer
      let cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
      
      // Remove common Project Gutenberg headers and footers
      const startMarkers = [
        '*** START OF THE PROJECT GUTENBERG EBOOK',
        '*** START OF THIS PROJECT GUTENBERG EBOOK',
        'START OF THE PROJECT GUTENBERG EBOOK'
      ];
      
      const endMarkers = [
        '*** END OF THE PROJECT GUTENBERG EBOOK',
        '*** END OF THIS PROJECT GUTENBERG EBOOK',
        'END OF THE PROJECT GUTENBERG EBOOK'
      ];
      
      // Find and remove header
      for (const marker of startMarkers) {
        const startIndex = cleanText.indexOf(marker);
        if (startIndex !== -1) {
          const endOfLine = cleanText.indexOf('\n', startIndex);
          if (endOfLine !== -1) {
            cleanText = cleanText.substring(endOfLine + 1);
            break;
          }
        }
      }
      
      // Find and remove footer
      for (const marker of endMarkers) {
        const endIndex = cleanText.lastIndexOf(marker);
        if (endIndex !== -1) {
          cleanText = cleanText.substring(0, endIndex);
          break;
        }
      }
      
      return cleanText.trim();
        
    } catch (error) {
      console.error('Error fetching book text:', error);
      throw new Error("Unable to load book content. Please try a different book.");
    }
  }
}