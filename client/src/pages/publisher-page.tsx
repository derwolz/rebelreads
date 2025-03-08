import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Link } from "wouter";
import { BookGrid } from "@/components/book-grid";

interface PublisherPageProps {}

export default function PublisherPage({}: PublisherPageProps) {
  const { id } = useParams<{ id: string }>();
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("all");

  const { data: publisherData, isLoading } = useQuery({
    queryKey: ["/api/publishers", id],
    enabled: !!id,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!publisherData) {
    return <div>Publisher not found</div>;
  }

  const { name, description, website, authors } = publisherData;

  const filteredAuthors = selectedAuthorId === "all" 
    ? authors 
    : authors.filter((a: any) => a.author.id.toString() === selectedAuthorId);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{name}</h1>
          {description && <p className="text-muted-foreground mb-4">{description}</p>}
          {website && (
            <a 
              href={website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit Website
            </a>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Authors</h2>
        <div className="flex gap-4 items-center">
          <Select
            value={selectedAuthorId}
            onValueChange={setSelectedAuthorId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select an author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authors.map((authorData: any) => (
                <SelectItem 
                  key={authorData.author.id} 
                  value={authorData.author.id.toString()}
                >
                  {authorData.author.authorName || authorData.author.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAuthors.map((authorData: any) => (
        <div key={authorData.author.id} className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {authorData.author.authorName || authorData.author.username}
            </h3>
            <Button asChild variant="outline">
              <Link href={`/authors/${authorData.author.id}`}>
                Visit Author Page
              </Link>
            </Button>
          </div>
          
          <BookGrid books={authorData.books} />
        </div>
      ))}
    </div>
  );
}
