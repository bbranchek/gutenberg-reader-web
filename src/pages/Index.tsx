import { useState } from 'react';
import { BookSearch } from '@/components/BookSearch';
import { BookViewer } from '@/components/BookViewer';
import { Book } from '@/services/gutenberg';

const Index = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
  };

  const handleBackToSearch = () => {
    setSelectedBook(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {selectedBook ? (
        <BookViewer 
          book={selectedBook} 
          onBack={handleBackToSearch}
        />
      ) : (
        <BookSearch onBookSelect={handleBookSelect} />
      )}
    </div>
  );
};

export default Index;
