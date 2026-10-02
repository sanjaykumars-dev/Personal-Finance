import { PageHeader } from "@/components/common/PageHeader";
import { AccountSection } from "@/components/settings/AccountSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { DataManagement } from "@/components/settings/DataManagement";
import { ProfileSection } from "@/components/settings/ProfileSection";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Profile, categories, appearance and your data." />
      <div className="space-y-6">
        <AccountSection />
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <ProfileSection />
          </div>
          <div className="xl:col-span-2">
            <AppearanceSection />
          </div>
        </div>
        <CategoryManager />
        <DataManagement />
      </div>
    </>
  );
}
