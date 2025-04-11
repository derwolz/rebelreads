import { SettingsSidebar } from "@/components/settings-sidebar";
import { HomepageSettings } from "@/components/homepage-settings";

export function HomepageSettingsPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your homepage layout and preferences
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <SettingsSidebar />
        <div className="flex-1">
          <HomepageSettings />
        </div>
      </div>
    </div>
  );
}