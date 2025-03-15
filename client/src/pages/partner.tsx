import { useState } from "react";
import { BrandedNav } from "@/components/branded-nav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function PartnerWithUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will be implemented later
    toast({
      title: "Message Sent",
      description: "Thank you for your interest. We'll be in touch soon!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <BrandedNav />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Partner With Sirened
          </h1>
          
          <div className="prose prose-lg dark:prose-invert mx-auto mb-16">
            <p>
              At Sirened, we're revolutionizing the way stories are discovered and shared. 
              Our mission is to create a vibrant ecosystem where authors and readers connect, 
              collaborate, and celebrate the art of storytelling.
            </p>
            
            <h2>Our Vision</h2>
            <p>
              We envision a future where every story finds its perfect audience, 
              where data-driven insights empower authors to create better content, 
              and where the joy of reading is enhanced through community engagement.
            </p>
            
            <h2>Partnership Goals</h2>
            <ul>
              <li>Enhance the author-reader connection through innovative technology</li>
              <li>Create sustainable revenue streams for content creators</li>
              <li>Build a diverse and inclusive literary marketplace</li>
              <li>Drive engagement through data-driven recommendations</li>
            </ul>
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-1">
                  Company
                </label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                />
              </div>
              
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
