import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";

// Import logos
import logo from "@/public/images/logo.svg";
import logoWhite from "@/public/images/logowhite.svg";
import icon from "@/public/images/icon.svg";
import iconWhite from "@/public/images/iconwhite.svg";
import sirenedLogo2 from "@/public/images/sirenedlogo2.png";

export default function BrandingPage() {
  const { theme } = useTheme();
  
  // Helper function to determine which logo to show based on current theme
  const getThemedLogo = () => {
    return theme === "light" ? logo : logoWhite;
  };
  
  const getThemedIcon = () => {
    return theme === "light" ? icon : iconWhite;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-4xl font-bold text-center mb-2">Sirened Brand Assets</h1>
        <p className="text-muted-foreground text-center max-w-2xl mb-6">
          Official logos and brand assets for Sirened, the digital book management platform.
          Use these assets according to our brand guidelines to maintain visual consistency.
        </p>
      </div>

      <Separator className="my-8" />

      {/* Primary Logo Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Primary Logo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Light Background</CardTitle>
              <CardDescription>Use this version on light backgrounds</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center bg-white rounded-md p-10">
              <img src={logo} alt="Sirened Logo Light Mode" className="max-w-full h-auto" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                SVG
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dark Background</CardTitle>
              <CardDescription>Use this version on dark backgrounds</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center bg-slate-900 rounded-md p-10">
              <img src={logoWhite} alt="Sirened Logo Dark Mode" className="max-w-full h-auto" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                SVG
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Icon Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Icon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Light Background</CardTitle>
              <CardDescription>Icon for light backgrounds, app icons, favicons</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center bg-white rounded-md p-10">
              <img src={icon} alt="Sirened Icon Light Mode" className="w-32 h-32" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                SVG
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dark Background</CardTitle>
              <CardDescription>Icon for dark backgrounds, app icons, favicons</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center bg-slate-900 rounded-md p-10">
              <img src={iconWhite} alt="Sirened Icon Dark Mode" className="w-32 h-32" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                SVG
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Alternative Logo Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Alternative Logo</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Alternative Logo Style</CardTitle>
              <CardDescription>Alternative logo format for special use cases</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center bg-white rounded-md p-10">
              <img src={sirenedLogo2} alt="Sirened Alternative Logo" className="max-w-full h-auto" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Color Palette Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Brand Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <div className="h-24 rounded-md bg-[#a06cd5]"></div>
            <p className="mt-2 font-medium">Primary Purple</p>
            <p className="text-sm text-muted-foreground">#a06cd5</p>
          </div>
          <div className="flex flex-col">
            <div className="h-24 rounded-md bg-slate-900"></div>
            <p className="mt-2 font-medium">Dark Slate</p>
            <p className="text-sm text-muted-foreground">#0f172a</p>
          </div>
          <div className="flex flex-col">
            <div className="h-24 rounded-md bg-white border"></div>
            <p className="mt-2 font-medium">White</p>
            <p className="text-sm text-muted-foreground">#ffffff</p>
          </div>
          <div className="flex flex-col">
            <div className="h-24 rounded-md bg-slate-200"></div>
            <p className="mt-2 font-medium">Light Gray</p>
            <p className="text-sm text-muted-foreground">#e2e8f0</p>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Typography</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Headings</h3>
              <p className="font-sans text-4xl mb-2">Inter / Sans Serif</p>
              <p className="text-sm text-muted-foreground">
                Used for all headings and prominent text elements
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Body Text</h3>
              <p className="font-sans text-base mb-2">Inter / Sans Serif</p>
              <p className="text-sm text-muted-foreground">
                Used for all body text and user interface elements
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Guidelines Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Usage Guidelines</h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✘</span>
                <p>Don't alter the logo colors or proportions</p>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✘</span>
                <p>Don't place the logo on busy backgrounds that reduce visibility</p>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✘</span>
                <p>Don't add effects like shadows or outlines to the logo</p>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <p>Maintain clear space around the logo (at least equal to the height of the "S")</p>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <p>Use the white version on dark backgrounds</p>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <p>Use the icon when space is limited (favicons, app icons, etc.)</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}