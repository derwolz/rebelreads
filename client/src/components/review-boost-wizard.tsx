import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { DragDropFile } from "@/components/drag-drop-file";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ReviewBoostWizardProps {
  open: boolean;
  onClose: () => void;
  books: Book[];
}

interface BookReviewCount {
  purchased: number;
  completed: number;
}

interface SelectedBookData {
  bookId: number;
  reviewCount: number;
  file: File | null;
}

export function ReviewBoostWizard({ open, onClose, books }: ReviewBoostWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedBooks, setSelectedBooks] = useState<SelectedBookData[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing review counts for books
  const { data: reviewCounts } = useQuery<Record<number, BookReviewCount>>({
    queryKey: ["/api/books/review-counts"],
  });

  const createBoostMutation = useMutation({
    mutationFn: async (data: { 
      selectedBooks: SelectedBookData[],
      totalCost: number 
    }) => {
      const formData = new FormData();
      data.selectedBooks.forEach((book) => {
        if (book.file) {
          formData.append(`files[${book.bookId}]`, book.file);
        }
        formData.append(`reviewCounts[${book.bookId}]`, book.reviewCount.toString());
      });
      formData.append("totalCost", data.totalCost.toString());

      return apiRequest("/api/campaigns/boost", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books/review-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      onClose();
      toast({
        title: "Success",
        description: "Review boost campaign created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create review boost campaign",
        variant: "destructive",
      });
    },
  });

  const totalPrice = selectedBooks.reduce((sum, book) => sum + book.reviewCount * 5, 0);

  const handleBookSelection = (bookId: number) => {
    setSelectedBooks(prev => {
      const isSelected = prev.find(b => b.bookId === bookId);
      if (isSelected) {
        return prev.filter(b => b.bookId !== bookId);
      } else {
        return [...prev, { bookId, reviewCount: 1, file: null }];
      }
    });
  };

  const updateReviewCount = (bookId: number, count: number) => {
    setSelectedBooks(prev => 
      prev.map(book => 
        book.bookId === bookId 
          ? { ...book, reviewCount: Math.max(1, count) }
          : book
      )
    );
  };

  const updateBookFile = (bookId: number, file: File | null) => {
    setSelectedBooks(prev => 
      prev.map(book => 
        book.bookId === bookId 
          ? { ...book, file }
          : book
      )
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedBooks.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one book",
        variant: "destructive",
      });
      return;
    }

    if (step === 2 && selectedBooks.some(book => book.reviewCount < 1)) {
      toast({
        title: "Error",
        description: "Please select at least one review for each book",
        variant: "destructive",
      });
      return;
    }

    if (step === 3 && selectedBooks.some(book => !book.file)) {
      toast({
        title: "Error",
        description: "Please upload files for all selected books",
        variant: "destructive",
      });
      return;
    }

    if (step === 4) {
      if (!acceptedTerms) {
        toast({
          title: "Error",
          description: "Please accept the terms and conditions",
          variant: "destructive",
        });
        return;
      }

      createBoostMutation.mutate({
        selectedBooks,
        totalCost: totalPrice,
      });
      return;
    }

    setStep(step + 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Select Books</DialogTitle>
              <DialogDescription>
                Choose the books you want to boost reviews for
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {books.map((book) => {
                const counts = reviewCounts?.[book.id] || { purchased: 0, completed: 0 };
                return (
                  <Card 
                    key={book.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedBooks.some(b => b.bookId === book.id) ? 'border-primary' : ''
                    }`}
                    onClick={() => handleBookSelection(book.id)}
                  >
                    <CardContent className="flex items-center p-4">
                      <Checkbox
                        checked={selectedBooks.some(b => b.bookId === book.id)}
                        onCheckedChange={() => handleBookSelection(book.id)}
                        className="mr-4"
                      />
                      <div className="flex items-center gap-4 flex-1">
                        <img 
                          src={book.coverUrl} 
                          alt={book.title} 
                          className="h-16 w-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {book.genres.join(", ")}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p>Reviews Purchased: {counts.purchased}</p>
                          <p>Reviews Completed: {counts.completed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Number of Reviews</DialogTitle>
              <DialogDescription>
                How many reviews would you like to receive for each book? ($5 per review)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedBooks.map((selected) => {
                const book = books.find(b => b.id === selected.bookId);
                if (!book) return null;

                return (
                  <div key={book.id} className="grid gap-2">
                    <div className="flex items-center gap-4">
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="h-16 w-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{book.title}</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`reviews-${book.id}`} className="text-right">
                        Reviews
                      </Label>
                      <Input
                        id={`reviews-${book.id}`}
                        type="number"
                        min="1"
                        className="col-span-3"
                        value={selected.reviewCount}
                        onChange={(e) => updateReviewCount(book.id, parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="text-right text-muted-foreground">
                Total Price: ${totalPrice}
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Upload Book Files</DialogTitle>
              <DialogDescription>
                Upload your books in .epub or .pdf format
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {selectedBooks.map((selected) => {
                const book = books.find(b => b.id === selected.bookId);
                if (!book) return null;

                return (
                  <div key={book.id} className="grid gap-2">
                    <div className="flex items-center gap-4 mb-2">
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="h-16 w-12 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-medium">{book.title}</h3>
                      </div>
                    </div>
                    <DragDropFile
                      file={selected.file}
                      onFileChange={(file) => updateBookFile(book.id, file)}
                      accept=".epub,.pdf"
                      maxSize={100 * 1024 * 1024} // 100MB
                    />
                  </div>
                );
              })}
            </div>
          </>
        );

      case 4:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Review and Confirm</DialogTitle>
              <DialogDescription>
                Please review your selections and accept the terms
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-4">
                <h3 className="font-medium">Selected Books:</h3>
                {selectedBooks.map((selected) => {
                  const book = books.find(b => b.id === selected.bookId);
                  if (!book) return null;

                  return (
                    <div key={book.id} className="flex items-center gap-4">
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="h-16 w-12 object-cover rounded"
                      />
                      <div>
                        <h4 className="font-medium">{book.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {selected.reviewCount} reviews × $5 = ${selected.reviewCount * 5}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-sm text-muted-foreground space-y-4 mt-4">
                <p>
                  By participating in the Review Boost program, you agree to the following terms:
                </p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Your book will be distributed to users with high engagement rates</li>
                  <li>Distribution of your book does not guarantee a review</li>
                  <li>Users who consistently fail to provide reviews will be removed from the program</li>
                  <li>The number of books distributed will equal the number of reviews purchased</li>
                  <li>Our AI-powered algorithm will match your book with readers most likely to enjoy it</li>
                  <li>Reviews will be honest and unbiased</li>
                  <li>No refunds will be provided once the boost program begins</li>
                </ul>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I accept the terms and conditions
                </label>
              </div>

              <div className="text-right font-medium">
                Total Price: ${totalPrice}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {renderStep()}
        <DialogFooter>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={createBoostMutation.isPending}
            >
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext}
            disabled={createBoostMutation.isPending}
          >
            {step === 4 ? (createBoostMutation.isPending ? "Creating..." : "Submit") : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}