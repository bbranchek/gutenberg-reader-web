import { useState } from 'react';
import { Search, Book, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GutenbergService, Book as BookType } from '@/services/gutenberg';
import { BookCard } from './BookCard';
import openBookImage from '@/assets/open-book-hero.jpg';

interface BookSearchProps {
  onBookSelect: (book: BookType) => void;
}

export const BookSearch = ({ onBookSelect }: BookSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'title' | 'author'>('title');
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await GutenbergService.searchBooks(searchQuery, 10, searchMode === 'author');
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
        <h1 className="text-4xl font-serif font-bold bg-gradient-hero bg-clip-text text-transparent">
          Gutenberg Reader
        </h1>
        <div className="flex justify-center mb-4 mt-6">
          <img 
            src={openBookImage} 
            alt="Open book illustration" 
            className="w-20 h-15 object-contain opacity-80"
          />
        </div>
        <p className="text-muted-foreground text-lg">
          Discover and read classic literature from Project Gutenberg
        </p>
      </div>

      <Card className="p-6 mb-8 bg-gradient-card border-border/50">
        <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as 'title' | 'author')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="title" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search by Title
            </TabsTrigger>
            <TabsTrigger value="author" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Search by Author
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="title">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Enter book title or keywords..."
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
          </TabsContent>
          
          <TabsContent value="author">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Enter author's full name (e.g., Charles Dickens)..."
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
          </TabsContent>
        </Tabs>
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