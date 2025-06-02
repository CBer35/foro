
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ForumClientContent from './components/ForumClientContent';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllMessagesWithReplies, getPolls, getUserPreferences } from '@/lib/file-store';
import type { Message, Poll, UserPreference } from '@/types';

export default async function ForumPage() {
  const cookieStore = cookies();
  const nickname = cookieStore.get('nickname')?.value;

  if (!nickname) {
    redirect('/');
  }

  let initialMessages: Message[] = [];
  let initialPolls: Poll[] = [];
  let initialUserPreferences: UserPreference[] = [];
  let errorLoadingData: string | null = null;

  try {
    initialMessages = await getAllMessagesWithReplies();
    initialPolls = await getPolls();
    initialUserPreferences = await getUserPreferences();
  } catch (error) {
    console.error("Error loading forum data from files:", error);
    errorLoadingData = "Could not load forum data. Please try again later.";
    initialMessages = [];
    initialPolls = [];
    initialUserPreferences = [];
  }


  return (
    <div className="animate-in fade-in duration-500">
      <Card className="mb-8 bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">
            Welcome to AnonymChat, <span className="text-accent">{nickname}</span>!
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Share your thoughts, create polls, and connect anonymously.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {errorLoadingData && (
        <Card className="mb-4 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive text-lg">Error</CardTitle>
            <CardDescription className="text-destructive-foreground">{errorLoadingData}</CardDescription>
          </CardHeader>
        </Card>
      )}
      <ForumClientContent 
        initialNickname={nickname} 
        initialMessages={initialMessages}
        initialPolls={initialPolls}
        initialUserPreferences={initialUserPreferences}
      />
    </div>
  );
}
