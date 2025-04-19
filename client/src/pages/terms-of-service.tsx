import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, ChevronUp } from "lucide-react";
import iconWhite from "@/public/images/iconwhite.svg";
import icon from "@/public/images/icon.svg";
import { useTheme } from "@/hooks/use-theme";

export default function TermsOfService() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-muted">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img
            src={theme === "light" ? icon : iconWhite}
            alt="Sirened Logo"
            className="h-14 w-14"
          />
          <div className="flex items-center gap-4">
            <Button 
              className="bg-[#EFA738] hover:bg-[#EFA738]/90 text-[#102b3F] font-bold" 
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container relative mx-auto px-4 py-24">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-3xl font-bold md:text-4xl">Terms of Service</h1>
        </div>

        <div className="prose prose-lg max-w-none dark:prose-invert">
          <p className="text-xl text-muted-foreground">
            Last updated: April 19, 2025
          </p>

          <Separator className="my-6" />

          <section id="introduction" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Introduction</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Welcome to Sirened! These Terms of Service ("Terms") govern your access to and use of the Sirened website and services (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section id="definitions" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Definitions</h2>
            <p className="text-lg text-muted-foreground mb-4">
              For the purposes of these Terms of Service:
            </p>
            <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
              <li><strong>Service</strong> refers to the Sirened website and platform.</li>
              <li><strong>User</strong> refers to the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service.</li>
              <li><strong>Content</strong> refers to text, images, and other information which may be shared, created, uploaded, or otherwise made available through the Service.</li>
              <li><strong>Author</strong> refers to users who publish and share their literary works through the Service.</li>
            </ul>
          </section>

          <section id="account-terms" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Account Terms</h2>
            <p className="text-lg text-muted-foreground mb-4">
              To use certain features of the Service, you must register for an account. When you register, you agree to:
            </p>
            <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
              <li>Provide accurate, current, and complete information about yourself.</li>
              <li>Maintain and promptly update your account information.</li>
              <li>Maintain the security of your account by not sharing your password and restricting access to your account.</li>
              <li>Notify Sirened immediately of any unauthorized access to or use of your account.</li>
              <li>Take responsibility for all activities that occur under your account and accept all risks of unauthorized access.</li>
            </ul>
          </section>

          <section id="user-content" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">User Content</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Our Service allows you to post, store, share, and make available certain information, text, graphics, or other material ("Content").
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              By posting Content on the Service, you:
            </p>
            <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
              <li>Grant Sirened a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display the Content in connection with the Service.</li>
              <li>Represent and warrant that you own or have the necessary rights to post the Content, and that the Content does not violate the rights of any third party or any law.</li>
              <li>Acknowledge that all Content you provide is accurate, complete, and up-to-date.</li>
              <li>Agree not to post, upload, or share Content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
            </ul>
          </section>

          <section id="author-terms" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Author Terms</h2>
            <p className="text-lg text-muted-foreground mb-4">
              If you register as an Author on our platform, the following additional terms apply:
            </p>
            <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
              <li>You retain ownership of all Content you submit, post, or display on or through the Service.</li>
              <li>You understand that your Content may be viewed, rated, reviewed, and shared by other users.</li>
              <li>You grant Sirened the right to showcase your Content for promotional purposes.</li>
              <li>You are responsible for ensuring that your Content does not infringe on copyright, trademark, or other intellectual property rights.</li>
              <li>You understand that the Review Boost program and similar promotional services do not guarantee positive reviews or specific results.</li>
            </ul>
          </section>

          <section id="prohibited-activities" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Prohibited Activities</h2>
            <p className="text-lg text-muted-foreground mb-4">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
              <li>Harass, abuse, or harm another person through the Service.</li>
              <li>Upload or transmit viruses, malware, or other types of malicious software, or content designed to interfere with or compromise the Service.</li>
              <li>Impersonate another user or person, including Sirened staff or representatives.</li>
              <li>Collect or track personal information of other users without their consent.</li>
              <li>Attempt to access areas or features of the Service that you are not authorized to access.</li>
              <li>Use the Service in a way that could disable, overburden, or impair the proper functioning of the Service or interfere with other users' enjoyment of the Service.</li>
            </ul>
          </section>

          <section id="intellectual-property" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-lg text-muted-foreground mb-4">
              The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Sirened and its licensors.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Sirened.
            </p>
          </section>

          <section id="limitation-of-liability" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-lg text-muted-foreground mb-4">
              In no event shall Sirened, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
              <li>Your access to or use of or inability to access or use the Service.</li>
              <li>Any conduct or content of any third party on the Service.</li>
              <li>Any content obtained from the Service.</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ul>
          </section>

          <section id="termination" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Termination</h2>
            <p className="text-lg text-muted-foreground mb-4">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section id="changes-to-terms" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-lg text-muted-foreground mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
            </p>
          </section>

          <section id="legal-jurisdiction" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Legal Jurisdiction</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Sirened is headquartered in Wyoming, USA, with servers located in the Philippines. By using Sirened, you agree that any disputes regarding these Terms of Service will be governed by the laws of Wyoming, USA.
            </p>
          </section>

          <section id="contact-us" className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-lg text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              <strong>Email:</strong> support@sirened.com
            </p>
          </section>
        </div>
        
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 rounded-full p-3 h-10 w-10"
          variant="outline"
          size="icon"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      </div>
      
      <footer className="bg-muted/30 border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sirened Publishing. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}