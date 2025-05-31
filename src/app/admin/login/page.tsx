
import NicknameForm from '@/components/NicknameForm'; // Re-using for simplicity, will rename/refactor if needed
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AdminLoginForm from './components/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-destructive/20 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-lg bg-card/90 backdrop-blur-sm">
        <CardHeader className="p-8">
          <CardTitle className="text-3xl font-headline text-center text-destructive">
            Admin Panel Login
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground mt-2">
            Please enter your administrator credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
