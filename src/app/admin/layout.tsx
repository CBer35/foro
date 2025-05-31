
// This layout applies to pages within /admin (e.g., /admin/dashboard)
// It does NOT apply to /admin/login, which is handled by middleware.
// The middleware ensures that only authenticated admins reach this layout.

import AdminHeader from './components/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-1 container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}
