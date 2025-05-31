import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NicknameForm from '@/components/NicknameForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function HomePage() {
  const cookieStore = cookies();
  const nickname = cookieStore.get('nickname')?.value;

  if (nickname) {
    redirect('/forum');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-lg bg-card/90 backdrop-blur-sm">
        <CardHeader className="p-8">
          <CardTitle className="text-3xl font-headline text-center text-primary">
            Welcome to AnonymChat
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground mt-2">
            Ingrese su seudónimo para continuar:
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <NicknameForm />
        </CardContent>
      </Card>
    </div>
  );
}
