
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck } from 'lucide-react';
import { adminLogoutAction } from '@/lib/actions';

export default function AdminHeader() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/admin" className="text-2xl font-headline font-bold text-destructive hover:text-destructive/80 transition-colors flex items-center">
          <ShieldCheck className="mr-2 h-7 w-7" /> Admin Panel
        </Link>
        <div className="flex items-center gap-4">
          <form action={adminLogoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
