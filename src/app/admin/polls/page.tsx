
import { adminGetAllPollsAction, createPollAction } from '@/lib/actions'; // createPollAction is already admin-only
import AdminPollList from './components/AdminPollList';
import PollForm from '@/app/(main)/forum/components/PollForm'; // Re-use the existing form
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, ListCollapse } from 'lucide-react';

export default async function AdminPollsPage() {
  const polls = await adminGetAllPollsAction();

  // The PollForm onPollCreated prop expects a function that receives a Poll object.
  // createPollAction returns a promise with { success, poll, error }.
  // For the admin page, we can simply revalidate or let the list update on next load.
  // A more sophisticated approach would involve client-side state update.
  // For now, we'll just rely on revalidation triggered by createPollAction.

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create New Poll</CardTitle>
          <CardDescription>Fill out the details below to create a new poll. It will be visible to all users.</CardDescription>
        </CardHeader>
        <CardContent>
          <PollForm 
            onPollCreated={(newPoll) => {
              // Server action `createPollAction` already revalidates path.
              // Client-side optimistic update could be added here if desired.
              console.log("Admin created new poll:", newPoll.id);
            }} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Manage Existing Polls</CardTitle>
          <CardDescription>View and delete polls.</CardDescription>
        </CardHeader>
        <CardContent>
          {polls.length === 0 ? (
            <div className="pt-6 flex flex-col items-center justify-center text-center">
              <ListCollapse className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No polls found.</p>
              <p className="text-sm text-muted-foreground">Create a poll above to get started.</p>
            </div>
          ) : (
            <AdminPollList initialPolls={polls} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
