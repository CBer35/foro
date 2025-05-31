import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Info, LogOut } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { handleSignOut } from '@/lib/actions';


export default function Header() {
  const cookieStore = cookies();
  const nickname = cookieStore.get('nickname')?.value;

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/forum" className="text-2xl font-headline font-bold text-primary hover:text-primary/80 transition-colors">
          AnonymChat
        </Link>
        <div className="flex items-center gap-4">
          {nickname && <span className="text-sm text-muted-foreground">Logged in as: {nickname}</span>}
          <Link href="/importante" passHref>
            <Button variant="outline" size="sm">
              <Info className="mr-2 h-4 w-4" />
              Important Info
            </Button>
          </Link>
          {nickname && (
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
