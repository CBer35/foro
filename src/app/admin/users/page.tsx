
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Palette } from 'lucide-react';
import { getAllUniqueNicknamesAction } from '@/lib/actions';
import { getUserPreferences } from '@/lib/file-store';
import AdminUserPreferenceList from './components/AdminUserPreferenceList';
import type { UserPreference } from '@/types';

export default async function AdminUsersPage() {
  const uniqueNicknames = await getAllUniqueNicknamesAction();
  const userPreferences: UserPreference[] = await getUserPreferences();

  return (
    <div className="animate-in fade-in duration-500">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Users className="mr-3 h-7 w-7 text-primary" />
            User Preferences Management
          </CardTitle>
          <CardDescription>
            Manage badges and background GIFs for user nicknames. Changes apply to all messages by that user.
          </CardDescription>
        </CardHeader>
      </Card>

      {uniqueNicknames.length === 0 ? (
         <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <Palette className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No user activity yet.</p>
                <p className="text-sm text-muted-foreground">Preferences can be set once users post messages or polls.</p>
            </CardContent>
        </Card>
      ) : (
        <AdminUserPreferenceList 
            nicknames={uniqueNicknames} 
            initialPreferences={userPreferences} 
        />
      )}
    </div>
  );
}
