import { OrganizationProvider } from '../../contexts/organization-context';
import { DashboardLayout } from '../../components/dashboard/layout';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </OrganizationProvider>
  );
}