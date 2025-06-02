
import { adminGetAllMessagesAction } from '@/lib/actions';
import AdminMessageList from './components/AdminMessageList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareWarning } from 'lucide-react';

export default async function AdminMessagesPage() {
  const messages = await adminGetAllMessagesAction();

  return (
    <div className="animate-in fade-in duration-500">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Manage Messages</CardTitle>
          <CardDescription>View and delete messages posted by users.</CardDescription>
        </CardHeader>
      </Card>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <MessageSquareWarning className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No messages found.</p>
            <p className="text-sm text-muted-foreground">Once users post messages, they will appear here for moderation.</p>
          </CardContent>
        </Card>
      ) : (
        <AdminMessageList initialMessages={messages} />
      )}
    </div>
  );
}
