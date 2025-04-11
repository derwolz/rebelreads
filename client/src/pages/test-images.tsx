import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";

export function TestImages() {
  const [book, setBook] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load book ID 24 directly, which we know has images
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/books/24");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setBook(data);
        console.log("Loaded book:", data);
      } catch (err) {
        console.error("Error loading book:", err);
        setError("Failed to load book");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Book Image Test Page</h1>
      
      {loading && <p>Loading book...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Debug Controls</h2>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.href = '/test-images'}
          >
            Reload Page
          </button>
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => window.location.href = '/'}
          >
            Back to Home
          </button>
        </div>
      </div>
      
      {book && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Book Details</h2>
            <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-40">
              {JSON.stringify(book, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Book Images</h2>
            <p>Total images: {book.images?.length || 0}</p>
            
            {book.images && book.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {book.images.map((image: any, index: number) => (
                  <Card key={index} className="p-4">
                    <h3 className="text-lg font-medium mb-2">
                      Type: {image.imageType}
                    </h3>
                    <div className="relative aspect-w-3 aspect-h-4 mb-2">
                      <img
                        src={image.imageUrl}
                        alt={`${image.imageType} image`}
                        className="object-cover rounded w-full h-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Size: {image.width}x{image.height} ({image.sizeKb}KB)
                    </p>
                    <p className="text-xs text-gray-400 mt-1 break-all">
                      URL: {image.imageUrl}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p>No images found for this book.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}