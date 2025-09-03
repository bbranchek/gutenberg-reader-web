import { useState } from 'react';
import { Search, Book, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GutenbergService, Book as BookType } from '@/services/gutenberg';
import { BookCard } from './BookCard';

interface BookSearchProps {
  onBookSelect: (book: BookType) => void;
}

export const BookSearch = ({ onBookSelect }: BookSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await GutenbergService.searchBooks(searchQuery);
      setBooks(results);
      
      if (results.length === 0) {
        toast({
          title: "No books found",
          description: "Try a different search term or author name.",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Book className="h-8 w-8 text-accent mr-3" />
          <h1 className="text-4xl font-serif font-bold bg-gradient-hero bg-clip-text text-transparent">
            Gutenberg Reader
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Discover and read classic literature from Project Gutenberg
        </p>
      </div>

      <Card className="p-6 mb-8 bg-gradient-card border-border/50">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for books, authors, or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-accent"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !searchQuery.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </form>
      </Card>

      {books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={() => onBookSelect(book)}
            />
          ))}
        </div>
      )}
    </div>
  );
};