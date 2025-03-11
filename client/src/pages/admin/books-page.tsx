import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCsvUploadWizard } from "@/components/book-csv-upload-wizard";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useState } from "react";

export default function AdminBooksPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="h-full pt-8">
            <AdminSidebar />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-60">
          <AdminSidebar />
        </div>

        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Book Management</CardTitle>
            </CardHeader>
            <CardContent>
              <BookCsvUploadWizard />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
