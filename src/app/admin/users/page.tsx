
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Construction } from 'lucide-react';

export default async function AdminUsersPage() {
  // In the future, you might fetch user data here.
  // For example: const users = await adminGetAllUniqueNicknamesAction();

  return (
    <div className="animate-in fade-in duration-500">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Users className="mr-3 h-7 w-7 text-primary" />
            User Management
          </CardTitle>
          <CardDescription>
            View user activity and manage user-related settings. 
            Currently, user interactions are primarily identified by nicknames.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Current Features</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground">
            This section is under development. Future features may include:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Viewing a list of all unique nicknames that have posted.</li>
            <li>Viewing all content posted by a specific nickname.</li>
            <li>Tools for managing problematic nicknames (e.g., banning).</li>
          </ul>
          <div className="mt-8 flex flex-col items-center justify-center text-center">
            <Construction className="h-24 w-24 text-primary/40 mb-4" />
            <p className="text-xl font-semibold text-primary/80">More User Management Features Coming Soon!</p>
            <p className="text-muted-foreground mt-1">
              We are working on expanding this section to provide more comprehensive user management tools.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
