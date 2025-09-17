import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookSearch } from '@/components/BookSearch';
import { BookViewer } from '@/components/BookViewer';
import { Book } from '@/services/gutenberg';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';

const Index = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
  };

  const handleBackToSearch = () => {
    setSelectedBook(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      {!selectedBook && (
        <div className="flex justify-end p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Welcome back!</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
      
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
