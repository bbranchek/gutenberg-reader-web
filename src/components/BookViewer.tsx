import { useState, useEffect } from 'react';
import { ArrowLeft, Book as BookIcon, Loader2, Type, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { GutenbergService, Book } from '@/services/gutenberg';

interface BookViewerProps {
  book: Book;
  onBack: () => void;
}

export const BookViewer = ({ book, onBack }: BookViewerProps) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const { toast } = useToast();

  useEffect(() => {
    const loadBook = async () => {
      setIsLoading(true);
      try {
        if (!book.textUrl) {
          throw new Error('No text version available for this book');
        }
        
        const text = await GutenbergService.getBookText(book.textUrl);
        setContent(text);
      } catch (error) {
        toast({
          title: "Failed to load book",
          description: "Unable to load the book content. Please try another book.",
          variant: "destructive",
        });
        console.error('Error loading book:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();
  }, [book, toast]);

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center bg-gradient-card">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <h2 className="text-xl font-serif font-semibold mb-2">Loading your book...</h2>
          <p className="text-muted-foreground">Please wait while we prepare "{book.title}"</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="border-border/50 hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
              
              <div className="flex items-center">
                <BookIcon className="h-5 w-5 text-accent mr-2" />
                <div>
                  <h1 className="font-serif font-semibold text-lg">{book.title}</h1>
                  <p className="text-sm text-muted-foreground">by {book.author}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustFontSize(-2)}
                className="border-border/50 hover:bg-secondary px-2"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">{fontSize}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustFontSize(2)}
                className="border-border/50 hover:bg-secondary px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="p-8 bg-book-page border-border/30">
          <div 
            className="prose prose-lg max-w-none font-serif text-book-text leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
          >
            <pre className="whitespace-pre-wrap font-serif text-book-text">
              {content}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};