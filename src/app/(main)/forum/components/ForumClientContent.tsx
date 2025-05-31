
'use client';

import { useState, useEffect } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import PollForm from './PollForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card'; // Keep Card import for potential future use if skeletons are re-added
import { MessageSquare, ListChecks } from 'lucide-react';

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
  
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  const handleMessageCommitted = (newMessage: Message) => {
    setMessages(prevMessages => [newMessage, ...prevMessages]);
  };
  
  const handleMessageUpdated = (updatedMessage: Message) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
    );
  };

  const handlePollCreated = (newPoll: Poll) => {
    setPolls(prevPolls => [newPoll, ...prevPolls]);
  };

  const handlePollUpdated = (updatedPoll: Poll) => {
    setPolls(prevPolls =>
      prevPolls.map(p => p.id === updatedPoll.id ? updatedPoll : p)
    );
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
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No messages yet. Be the first to post!</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                currentNickname={initialNickname} 
                onMessageUpdated={handleMessageUpdated} 
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="polls">
        <PollForm onPollCreated={handlePollCreated} /> 
        <h2 className="text-2xl font-headline mb-4">Active Polls</h2>
        {polls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No polls available. Why not create one?</p>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <PollItem 
                key={poll.id} 
                poll={poll} 
                currentNickname={initialNickname} 
                onPollUpdated={handlePollUpdated} 
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
