
'use client';

import { useState, useEffect } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import PollForm from './PollForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { MessageSquare, ListChecks } from 'lucide-react';
// Firebase specific imports removed
// import { db } from '@/lib/firebase';
// import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

interface ForumClientContentProps {
  initialNickname: string;
  initialMessages: Message[];
  initialPolls: Poll[];
}

export default function ForumClientContent({ 
  initialNickname, 
  initialMessages, 
  initialPolls 
}: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  
  // Loading states are less relevant now as initial data is passed as props.
  // They could be used if we implement optimistic updates or client-side filtering/sorting later.
  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // Set to false initially
  const [isLoadingPolls, setIsLoadingPolls] = useState(false); // Set to false initially

  // Update local state if props change (e.g., after revalidation and page reload)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);


  // Callbacks are simplified as revalidatePath in server actions handles data refresh.
  // Optimistic updates could be added here for a smoother UX if desired.
  const handleMessageCommitted = () => {
    // Form clears itself. Revalidation will update the list.
    // To see immediate effect without waiting for revalidation, one could add optimistic update here.
  };
  
  const handleNewPoll = () => {
    // Form clears itself. Revalidation will update the list.
  };

  const onInteractionSuccess = () => {
    // Revalidation will update the list.
  };


  return (
    <Tabs defaultValue="messages" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="messages"><MessageSquare className="mr-2 h-5 w-5" />Messages</TabsTrigger>
        <TabsTrigger value="polls"><ListChecks className="mr-2 h-5 w-5" />Polls</TabsTrigger>
      </TabsList>
      
      <TabsContent value="messages">
        <MessageForm onMessageCommitted={handleMessageCommitted} />
        <h2 className="text-2xl font-headline mb-4">Recent Messages</h2>
        {isLoadingMessages ? ( // This might be removed or tied to a different logic
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="mb-4 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No messages yet. Be the first to post!</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} currentNickname={initialNickname} onRepostSuccess={onInteractionSuccess} />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="polls">
        <PollForm onPollCreated={handleNewPoll} /> 
        <h2 className="text-2xl font-headline mb-4">Active Polls</h2>
        {isLoadingPolls ? ( // This might be removed or tied to a different logic
          Array.from({ length: 2 }).map((_, index) => (
             <Card key={index} className="mb-6 p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))
        ) : polls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No polls available. Why not create one?</p>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <PollItem key={poll.id} poll={poll} currentNickname={initialNickname} onPollVoted={onInteractionSuccess} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
