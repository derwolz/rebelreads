import { SocialMediaLink } from "@shared/schema";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconType } from "react-icons";

interface SocialMediaLinksProps {
  links: SocialMediaLink[];
  className?: string;
}

const PlatformIcons: Record<string, IconType> = {
  Twitter: FaTwitter,
  Facebook: FaFacebook,
  Instagram: FaInstagram,
  LinkedIn: FaLinkedin,
  GitHub: FaGithub,
};

export function SocialMediaLinks({ links, className }: SocialMediaLinksProps) {
  if (!links?.length) return null;

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {links.map((link, index) => {
        const Icon = PlatformIcons[link.platform] || ExternalLink;
        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon className="h-4 w-4" />
              <span className="sr-only">{link.platform}</span>
            </Button>
          </a>
        );
      })}
    </div>
  );
}