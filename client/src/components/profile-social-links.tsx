
import { SocialMediaLink } from "@shared/schema";
import { SocialMediaDisplay } from "./social-media-links";

interface ProfileSocialLinksProps {
  links: SocialMediaLink[];
  className?: string;
}

export function ProfileSocialLinks({ links, className }: ProfileSocialLinksProps) {
  if (!links || links.length === 0) return null;
  
  return (
    <div className={className}>
      <h3 className="text-sm font-medium mb-2">Social Media</h3>
      <SocialMediaDisplay links={links} />
    </div>
  );
}
