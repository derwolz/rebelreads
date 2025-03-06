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

interface ReviewBoostWizardProps {
  open: boolean;
  onClose: () => void;
  books: Book[];
}

export function ReviewBoostWizard({ open, onClose, books }: ReviewBoostWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [reviewCount, setReviewCount] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();

  const totalPrice = reviewCount * 5;

  const handleNext = () => {
    if (step === 1 && selectedBooks.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one book",
        variant: "destructive",
      });
      return;
    }

    if (step === 2 && reviewCount < 1) {
      toast({
        title: "Error",
        description: "Please select at least one review",
        variant: "destructive",
      });
      return;
    }

    if (step === 3 && !file) {
      toast({
        title: "Error",
        description: "Please upload your book file",
        variant: "destructive",
      });
      return;
    }

    if (step === 4 && !acceptedTerms) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      // Handle submission - to be implemented
      console.log("Submit:", { selectedBooks, reviewCount, file });
      onClose();
    }
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
              {books.map((book) => (
                <Card key={book.id} className="cursor-pointer" onClick={() => {
                  setSelectedBooks(prev => 
                    prev.includes(book.id) 
                      ? prev.filter(id => id !== book.id)
                      : [...prev, book.id]
                  );
                }}>
                  <CardContent className="flex items-center p-4">
                    <Checkbox
                      checked={selectedBooks.includes(book.id)}
                      onCheckedChange={() => {
                        setSelectedBooks(prev => 
                          prev.includes(book.id) 
                            ? prev.filter(id => id !== book.id)
                            : [...prev, book.id]
                        );
                      }}
                    />
                    <div className="ml-4">
                      <h3 className="font-medium">{book.title}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Number of Reviews</DialogTitle>
              <DialogDescription>
                How many reviews would you like to receive? ($5 per review)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reviews" className="text-right">
                  Reviews
                </Label>
                <Input
                  id="reviews"
                  type="number"
                  min="1"
                  className="col-span-3"
                  value={reviewCount}
                  onChange={(e) => setReviewCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
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
              <DialogTitle>Upload Book File</DialogTitle>
              <DialogDescription>
                Upload your book in .epub format
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <DragDropFile
                file={file}
                onFileChange={setFile}
                accept=".epub"
                maxSize={100 * 1024 * 1024} // 100MB
              />
            </div>
          </>
        );

      case 4:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Terms and Conditions</DialogTitle>
              <DialogDescription>
                Please review and accept our terms
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="text-sm text-muted-foreground space-y-4">
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
      <DialogContent className="sm:max-w-[600px]">
        {renderStep()}
        <DialogFooter>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          <Button onClick={handleNext}>
            {step === 4 ? "Submit" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
