
'use client';

import type { Poll } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, BarChartBig, Fingerprint } from 'lucide-react'; // Added Fingerprint
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { adminDeletePollAction } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from '@/components/ui/progress';

interface AdminPollItemProps {
  poll: Poll;
  onPollDeleted: (pollId: string) => void;
}

export default function AdminPollItem({ poll, onPollDeleted }: AdminPollItemProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    const result = await adminDeletePollAction(poll.id);
    if (result?.success) {
      toast({ title: "Success", description: result.success });
      onPollDeleted(poll.id);
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChartBig className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">{poll.question}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          ID: {poll.id} • Posted by {poll.nickname} • {formatDistanceToNow(new Date(poll.timestamp), { addSuffix: true })} • {poll.totalVotes} vote(s)
        </CardDescription>
         {poll.ipAddress && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Fingerprint className="h-3 w-3" /> IP: {poll.ipAddress}
            </p>
          )}
      </CardHeader>
      <CardContent className="pb-4 text-sm">
        <ul className="space-y-2">
          {poll.options.map((option) => {
            const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
            return (
              <li key={option.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span>{option.text}</span>
                  <span className="text-muted-foreground">({option.votes} votes, {percentage.toFixed(1)}%)</span>
                </div>
                <Progress value={percentage} className="h-2 [&>div]:bg-accent" aria-label={`${percentage.toFixed(0)}% for ${option.text}`} />
              </li>
            );
          })}
        </ul>
      </CardContent>
      <CardFooter className="flex justify-end items-center pt-0">
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Poll
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the poll
                and all its associated votes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Yes, delete poll
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
