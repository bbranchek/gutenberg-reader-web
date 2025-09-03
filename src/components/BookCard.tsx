import { Book as BookIcon, Download, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book } from '@/services/gutenberg';

interface BookCardProps {
  book: Book;
  onSelect: () => void;
}

export const BookCard = ({ book, onSelect }: BookCardProps) => {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 bg-gradient-card border-border/50 group cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-serif font-semibold text-lg text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {book.title}
            </h3>
            <div className="flex items-center text-muted-foreground mt-2">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">{book.author}</span>
            </div>
          </div>
          <BookIcon className="h-6 w-6 text-accent/60 group-hover:text-accent transition-colors" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-secondary/50">
            <Download className="h-3 w-3 mr-1" />
            {book.downloadCount.toLocaleString()} downloads
          </Badge>
          
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Read
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};