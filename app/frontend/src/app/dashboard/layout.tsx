import { OrganizationProvider } from '../../contexts/organization-context';
import { SearchProvider } from '../../contexts/search-context';
import { DashboardLayout } from '../../components/dashboard/layout';
import { ImpersonationCheck } from '@/components/ImpersonationCheck';
import ImpersonationBanner from '../../components/impersonation-banner';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationProvider>
      <SearchProvider>
        <ImpersonationBanner />
        <ImpersonationCheck />
        <DashboardLayout>{children}</DashboardLayout>
      </SearchProvider>
    </OrganizationProvider>
  );
}
