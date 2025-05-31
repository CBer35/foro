
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import PollForm from './PollForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { MessageSquare, ListChecks } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

interface ForumClientContentProps {
  initialNickname: string;
}

export default function ForumClientContent({ initialNickname }: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  // Fetch Messages from Firestore
  useEffect(() => {
    setIsLoadingMessages(true);
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({ 
          ...data, 
          id: doc.id, 
          // Convert Firestore Timestamp to JS Date for client-side use
          timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate() : new Date(data.timestamp) 
        } as Message);
      });
      setMessages(fetchedMessages);
      setIsLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, []);

  // Fetch Polls from Firestore
  useEffect(() => {
    setIsLoadingPolls(true);
    const q = query(collection(db, 'polls'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPolls: Poll[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPolls.push({ 
          ...data, 
          id: doc.id, 
          timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate() : new Date(data.timestamp)
        } as Poll);
      });
      setPolls(fetchedPolls);
      setIsLoadingPolls(false);
    }, (error) => {
      console.error("Error fetching polls: ", error);
      setIsLoadingPolls(false);
    });
    
    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, []);


  // Callbacks for forms will now rely on server actions to update Firestore,
  // and onSnapshot will update the local state.
  // So, optimistic updates here are less critical but can be kept for perceived speed.
  // For simplicity, we'll remove direct client-side manipulation after form submission,
  // as Firestore real-time updates will handle it.

  const handleMessageCommitted = () => {
    // No direct state update needed here if onSnapshot is working,
    // but could re-trigger a fetch or rely on revalidatePath from server action if not real-time.
    // For now, Firestore's onSnapshot should handle this.
  };
  
  const handleNewPoll = () => {
    // Similar to messages, onSnapshot will update the state.
  };

  const onInteractionSuccess = () => {
    // General refresh/rely on onSnapshot
  };


  return (
    <Tabs defaultValue="messages" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="messages"><MessageSquare className="mr-2 h-5 w-5" />Messages</TabsTrigger>
        <TabsTrigger value="polls"><ListChecks className="mr-2 h-5 w-5" />Polls</TabsTrigger>
      </TabsList>
      
      <TabsContent value="messages">
        {/* Pass initialNickname to MessageForm if it needs it for any client-side logic before action */}
        <MessageForm onMessageCommitted={handleMessageCommitted} />
        <h2 className="text-2xl font-headline mb-4">Recent Messages</h2>
        {isLoadingMessages ? (
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
        {isLoadingPolls ? (
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
