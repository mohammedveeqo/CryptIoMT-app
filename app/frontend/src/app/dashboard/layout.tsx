import { OrganizationProvider } from '../../contexts/organization-context';
import { DashboardLayout } from '../../components/dashboard/layout';
import { ImpersonationCheck } from '@/components/ImpersonationCheck';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationProvider>
      <ImpersonationCheck />
      <DashboardLayout>{children}</DashboardLayout>
    </OrganizationProvider>
  );
}