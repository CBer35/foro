import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ForumClientContent from './components/ForumClientContent'; // Updated path
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ForumPage() {
  const cookieStore = cookies();
  const nickname = cookieStore.get('nickname')?.value;

  if (!nickname) {
    redirect('/');
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
      
      <ForumClientContent initialNickname={nickname} />
    </div>
  );
}
