import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SignupInterest } from "@shared/schema";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

const EmailCollectionPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState<SignupInterest[]>([]);
  
  // Fetch email collection data
  const { data: emailCollection, isLoading } = useQuery({
    queryKey: ["/api/admin/signup-interests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/signup-interests");
      if (!response.ok) {
        throw new Error("Failed to fetch email collection data");
      }
      return response.json() as Promise<SignupInterest[]>;
    },
  });

  // Filter data based on search
  useEffect(() => {
    if (emailCollection) {
      if (!search) {
        setFilteredData(emailCollection);
      } else {
        const searchLower = search.toLowerCase();
        setFilteredData(
          emailCollection.filter((item) => 
            item.email.toLowerCase().includes(searchLower)
          )
        );
      }
    }
  }, [search, emailCollection]);

  // Export data as CSV
  const exportToCSV = () => {
    if (!emailCollection || emailCollection.length === 0) return;
    
    const headers = ["ID", "Email", "Is Publisher", "Is Author Interest", "Created At"];
    const csvContent = [
      headers.join(","),
      ...emailCollection.map((item) => [
        item.id,
        item.email,
        item.isPublisher ? "Yes" : "No",
        item.isAuthorInterest ? "Yes" : "No",
        format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss")
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `email-collection-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Email collection data has been exported to CSV."
    });
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Email Collection Dashboard</h1>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Emails</TabsTrigger>
          <TabsTrigger value="authors">Author Interests</TabsTrigger>
          <TabsTrigger value="publishers">Publisher Interests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Email Subscriptions</CardTitle>
              <CardDescription>
                View all email subscriptions collected from the landing page.
              </CardDescription>
              <div className="flex justify-between items-center mt-4">
                <div className="relative w-72">
                  <Input
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center">Loading email data...</div>
              ) : (
                <Table>
                  <TableCaption>
                    {filteredData?.length === 0
                      ? "No email subscriptions found"
                      : `Showing ${filteredData?.length} email subscription${filteredData?.length === 1 ? "" : "s"}`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.email}</TableCell>
                        <TableCell>
                          {item.isAuthorInterest && <Badge className="mr-2">Author Interest</Badge>}
                          {item.isPublisher && <Badge variant="outline">Publisher</Badge>}
                          {!item.isAuthorInterest && !item.isPublisher && <Badge variant="secondary">Reader</Badge>}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.createdAt), "PPP p")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="authors">
          <Card>
            <CardHeader>
              <CardTitle>Author Interest</CardTitle>
              <CardDescription>
                Users who have indicated interest in being authors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center">Loading email data...</div>
              ) : (
                <Table>
                  <TableCaption>
                    {filteredData?.filter(item => item.isAuthorInterest).length === 0
                      ? "No author interests found"
                      : `Showing ${filteredData?.filter(item => item.isAuthorInterest).length} author interest${filteredData?.filter(item => item.isAuthorInterest).length === 1 ? "" : "s"}`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Date Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData?.filter(item => item.isAuthorInterest).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.email}</TableCell>
                        <TableCell>
                          {format(new Date(item.createdAt), "PPP p")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="publishers">
          <Card>
            <CardHeader>
              <CardTitle>Publisher Interest</CardTitle>
              <CardDescription>
                Users who have indicated interest in being publishers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center">Loading email data...</div>
              ) : (
                <Table>
                  <TableCaption>
                    {filteredData?.filter(item => item.isPublisher).length === 0
                      ? "No publisher interests found"
                      : `Showing ${filteredData?.filter(item => item.isPublisher).length} publisher interest${filteredData?.filter(item => item.isPublisher).length === 1 ? "" : "s"}`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Date Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData?.filter(item => item.isPublisher).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.email}</TableCell>
                        <TableCell>
                          {format(new Date(item.createdAt), "PPP p")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailCollectionPage;