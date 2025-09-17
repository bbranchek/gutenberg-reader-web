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
  
  static async searchBooks(query: string, limit: number = 10, searchByAuthor: boolean = false): Promise<Book[]> {
    try {
      // For author searches, use the search parameter but fetch more results to filter
      const searchQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.BASE_URL}?search=${searchQuery}&page_size=100`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search books');
      }
      
      const data: GutenbergResponse = await response.json();
      
      // Filter and rank books
      const queryLower = query.toLowerCase();
      const rankedBooks: { book: Book; score: number }[] = [];
      const seenTitles = new Set<string>();
      
      data.results.forEach(book => {
        // Look for various text formats in order of preference
        const textUrl = book.formats['text/plain; charset=utf-8'] || 
                       book.formats['text/plain; charset=us-ascii'] ||
                       book.formats['text/plain'] ||
                       book.formats['application/plain'];
        
        if (textUrl && !seenTitles.has(book.title.toLowerCase())) {
          seenTitles.add(book.title.toLowerCase());
          
          let score = 0;
          
          if (searchByAuthor) {
            // For author searches, score by author name relevance
            const authorName = book.authors.length > 0 ? book.authors[0].name.toLowerCase() : '';
            
            // Normalize names for better matching (handle "Dickens, Charles" vs "Charles Dickens")
            const normalizedAuthor = authorName.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim();
            const normalizedQuery = queryLower.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Split names into words for flexible matching
            const authorWords = normalizedAuthor.split(' ');
            const queryWords = normalizedQuery.split(' ');
            
            // Check for exact match (any order)
            if (normalizedAuthor === normalizedQuery || authorName === queryLower) {
              score = 100;
            }
            // Check if all query words are present in author name
            else if (queryWords.every(word => authorWords.some(authorWord => authorWord.includes(word)))) {
              score = 90;
            }
            // Check if author name starts with query
            else if (normalizedAuthor.startsWith(normalizedQuery)) {
              score = 85;
            }
            // Check if query words match author words (partial matches)
            else if (queryWords.some(word => authorWords.some(authorWord => authorWord.includes(word)))) {
              const matchRatio = queryWords.filter(word => 
                authorWords.some(authorWord => authorWord.includes(word))
              ).length / queryWords.length;
              score = matchRatio * 70;
            }
          } else {
            // For title searches, score by title relevance
            const titleLower = book.title.toLowerCase();
            
            // Exact match gets highest score
            if (titleLower === queryLower) {
              score = 100;
            }
            // Title starts with query gets high score
            else if (titleLower.startsWith(queryLower)) {
              score = 80;
            }
            // Title contains exact query gets medium score
            else if (titleLower.includes(queryLower)) {
              score = 60;
            }
            // Word-by-word matching gets lower score
            else {
              const queryWords = queryLower.split(' ');
              const titleWords = titleLower.split(' ');
              const matchingWords = queryWords.filter(word => 
                titleWords.some(titleWord => titleWord.includes(word))
              ).length;
              score = (matchingWords / queryWords.length) * 40;
            }
          }
          
          // For author searches, only include books with score > 0
          // For title searches, include any book with score > 0
          if (score > 0) {
            rankedBooks.push({
              book: {
                id: book.id,
                title: book.title,
                author: book.authors.length > 0 ? book.authors[0].name : 'Unknown Author',
                downloadCount: book.download_count,
                textUrl: textUrl,
                htmlUrl: book.formats['text/html']
              },
              score
            });
          }
        }
      });
      
      // Sort by score descending and return top results
      return rankedBooks
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.book);
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  }
  
  static async getBookText(url: string): Promise<string> {
    try {
      // Try multiple CORS proxies in order of preference
      const corsProxies = [
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy?quest='
      ];
      
      let lastError: Error | null = null;
      
      for (const proxy of corsProxies) {
        try {
          const targetUrl = encodeURIComponent(url);
          const proxyUrl = proxy + targetUrl;
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/plain,text/html,*/*',
            },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const text = await response.text();
          
          // Validate that we got actual book content, not an error page
          if (text.length < 100 || text.includes('Access denied') || text.includes('Error')) {
            throw new Error('Invalid content received');
          }
          
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
          
          const finalText = cleanText.trim();
          
          // Final validation - ensure we have substantial content
          if (finalText.length < 50) {
            throw new Error('Book content too short');
          }
          
          return finalText;
          
        } catch (error) {
          lastError = error as Error;
          console.warn(`Proxy ${proxy} failed:`, error);
          continue; // Try next proxy
        }
      }
      
      // If all proxies failed, throw the last error
      throw lastError || new Error('All CORS proxies failed');
        
    } catch (error) {
      console.error('Error fetching book text:', error);
      throw new Error("Unable to load book content. This book may not be available in readable format.");
    }
  }
}