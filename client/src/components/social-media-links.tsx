
import { useState } from "react";
import { 
  Button, 
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui";
import { SOCIAL_MEDIA_PLATFORMS, SocialMediaLink } from "@shared/schema";
import { 
  FaTwitter, 
  FaInstagram, 
  FaFacebook, 
  FaTiktok, 
  FaYoutube, 
  FaLinkedin, 
  FaGoodreadsG, 
  FaPinterest, 
  FaReddit, 
  FaTumblr, 
  FaMediumM, 
  FaPatreon, 
  FaDiscord, 
  FaTwitch, 
  FaMastodon
} from "react-icons/fa6";
import { IoGlobeOutline } from "react-icons/io5";
import { SiSubstack, SiThreads, SiBluesky } from "react-icons/si";
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";

interface SocialMediaLinksProps {
  links: SocialMediaLink[];
  onChange: (links: SocialMediaLink[]) => void;
  className?: string;
}

export function SocialMediaLinks({ links, onChange, className }: SocialMediaLinksProps) {
  const [newLink, setNewLink] = useState<SocialMediaLink>({
    platform: "twitter",
    url: "",
  });

  const addLink = () => {
    if (!newLink.url || !newLink.platform) return;
    
    if (newLink.platform === "custom" && !newLink.displayName) {
      // Require a display name for custom platforms
      return;
    }

    onChange([...links, { ...newLink }]);
    setNewLink({
      platform: "twitter",
      url: "",
      displayName: ""
    });
  };

  const removeLink = (index: number) => {
    const updatedLinks = [...links];
    updatedLinks.splice(index, 1);
    onChange(updatedLinks);
  };

  const getIconForPlatform = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <FaTwitter className="h-4 w-4" />;
      case "instagram":
        return <FaInstagram className="h-4 w-4" />;
      case "facebook":
        return <FaFacebook className="h-4 w-4" />;
      case "tiktok":
        return <FaTiktok className="h-4 w-4" />;
      case "youtube":
        return <FaYoutube className="h-4 w-4" />;
      case "linkedin":
        return <FaLinkedin className="h-4 w-4" />;
      case "goodreads":
        return <FaGoodreadsG className="h-4 w-4" />;
      case "pinterest":
        return <FaPinterest className="h-4 w-4" />;
      case "reddit":
        return <FaReddit className="h-4 w-4" />;
      case "tumblr":
        return <FaTumblr className="h-4 w-4" />;
      case "medium":
        return <FaMediumM className="h-4 w-4" />;
      case "substack":
        return <SiSubstack className="h-4 w-4" />;
      case "patreon":
        return <FaPatreon className="h-4 w-4" />;
      case "discord":
        return <FaDiscord className="h-4 w-4" />;
      case "twitch":
        return <FaTwitch className="h-4 w-4" />;
      case "mastodon":
        return <FaMastodon className="h-4 w-4" />;
      case "threads":
        return <SiThreads className="h-4 w-4" />;
      case "bluesky":
        return <SiBluesky className="h-4 w-4" />;
      case "custom":
      default:
        return <IoGlobeOutline className="h-4 w-4" />;
    }
  };

  const getPlatformName = (platform: string): string => {
    switch (platform) {
      case "twitter":
        return "Twitter";
      case "instagram":
        return "Instagram";
      case "facebook":
        return "Facebook";
      case "tiktok":
        return "TikTok";
      case "youtube":
        return "YouTube";
      case "linkedin":
        return "LinkedIn";
      case "goodreads":
        return "Goodreads";
      case "pinterest":
        return "Pinterest";
      case "reddit":
        return "Reddit";
      case "tumblr":
        return "Tumblr";
      case "medium":
        return "Medium";
      case "substack":
        return "Substack";
      case "patreon":
        return "Patreon";
      case "discord":
        return "Discord";
      case "twitch":
        return "Twitch";
      case "mastodon":
        return "Mastodon";
      case "threads":
        return "Threads";
      case "bluesky":
        return "Bluesky";
      case "custom":
        return "Custom";
      default:
        return platform;
    }
  };

  return (
    <div className={className}>
      <h3 className="font-medium mb-2">Social Media Links</h3>
      
      <div className="space-y-2 mb-4">
        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-2 group">
            <div className="w-8 flex justify-center">
              {getIconForPlatform(link.platform)}
            </div>
            <div className="flex-1">
              {link.platform === "custom" ? link.displayName : getPlatformName(link.platform)}
            </div>
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {link.url}
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => removeLink(index)} 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Cross2Icon className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {links.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No social media links added yet.
          </div>
        )}
      </div>

      <div className="flex gap-2 items-end">
        <div className="w-1/3">
          <Select 
            value={newLink.platform} 
            onValueChange={(value) => setNewLink({ ...newLink, platform: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_MEDIA_PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  <div className="flex items-center gap-2">
                    {getIconForPlatform(platform)}
                    <span>{getPlatformName(platform)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {newLink.platform === "custom" && (
          <div className="w-1/3">
            <Input
              placeholder="Display Name"
              value={newLink.displayName || ""}
              onChange={(e) => setNewLink({ ...newLink, displayName: e.target.value })}
            />
          </div>
        )}

        <div className={newLink.platform === "custom" ? "w-1/3" : "flex-1"}>
          <Input
            placeholder="URL"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          />
        </div>

        <Button onClick={addLink} size="icon">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SocialMediaDisplay({ links }: { links: SocialMediaLink[] }) {
  const getIconForPlatform = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <FaTwitter className="h-5 w-5" />;
      case "instagram":
        return <FaInstagram className="h-5 w-5" />;
      case "facebook":
        return <FaFacebook className="h-5 w-5" />;
      case "tiktok":
        return <FaTiktok className="h-5 w-5" />;
      case "youtube":
        return <FaYoutube className="h-5 w-5" />;
      case "linkedin":
        return <FaLinkedin className="h-5 w-5" />;
      case "goodreads":
        return <FaGoodreadsG className="h-5 w-5" />;
      case "pinterest":
        return <FaPinterest className="h-5 w-5" />;
      case "reddit":
        return <FaReddit className="h-5 w-5" />;
      case "tumblr":
        return <FaTumblr className="h-5 w-5" />;
      case "medium":
        return <FaMediumM className="h-5 w-5" />;
      case "substack":
        return <SiSubstack className="h-5 w-5" />;
      case "patreon":
        return <FaPatreon className="h-5 w-5" />;
      case "discord":
        return <FaDiscord className="h-5 w-5" />;
      case "twitch":
        return <FaTwitch className="h-5 w-5" />;
      case "mastodon":
        return <FaMastodon className="h-5 w-5" />;
      case "threads":
        return <SiThreads className="h-5 w-5" />;
      case "bluesky":
        return <SiBluesky className="h-5 w-5" />;
      case "custom":
      default:
        return <IoGlobeOutline className="h-5 w-5" />;
    }
  };

  if (!links || links.length === 0) return null;

  return (
    <div className="flex gap-2 mt-2">
      {links.map((link, index) => (
        <a 
          key={index} 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title={link.platform === "custom" ? link.displayName : link.platform}
        >
          {getIconForPlatform(link.platform)}
        </a>
      ))}
    </div>
  );
}
