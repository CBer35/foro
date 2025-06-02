
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ListChecks, Users, BarChart, ShieldAlert, PencilLine, Trash2, PlusSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <Card className="mb-8 bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-destructive">
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Welcome to the AnonymChat control center. Manage content and users.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Manage Messages</CardTitle>
            <MessageSquare className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View, and delete user messages.
            </p>
            <Link href="/admin/messages" passHref>
              <Button className="w-full">
                <PencilLine className="mr-2 h-5 w-5" /> Go to Messages
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Manage Polls</CardTitle>
            <ListChecks className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create, view, and delete polls.
            </p>
            <Link href="/admin/polls" passHref>
              <Button className="w-full">
                <PlusSquare className="mr-2 h-5 w-5" /> Go to Polls
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="opacity-50 cursor-not-allowed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              View or manage users (if applicable).
            </p>
          </CardContent>
        </Card>

         <Card className="opacity-50 cursor-not-allowed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Analytics</CardTitle>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              View site usage statistics.
            </p>
          </CardContent>
        </Card>
      </div>
       <div className="mt-12 text-center">
          <ShieldAlert className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            More admin functionalities will be added soon.
          </p>
      </div>
    </div>
  );
}
