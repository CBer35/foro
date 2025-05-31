
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import PollForm from './PollForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ListChecks } from 'lucide-react';
import { fetchLatestMessagesAction } from '@/lib/actions';

interface ForumClientContentProps {
  initialNickname: string;
  initialMessages: Message[]; // These are top-level messages
  initialPolls: Poll[];
}

export default function ForumClientContent({ 
  initialNickname, 
  initialMessages, 
  initialPolls 
}: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.filter(msg => !msg.parentId)); // Ensure only top-level
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  
  useEffect(() => {
    // Filter for top-level messages when initialMessages prop changes
    setMessages(initialMessages.filter(msg => !msg.parentId));
  }, [initialMessages]);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  const fetchAndUpdateMessages = useCallback(async () => {
    try {
      const latestTopLevelMessages = await fetchLatestMessagesAction(); // This now fetches only top-level
      setMessages(latestTopLevelMessages);
    } catch (error) {
      console.error("Error fetching latest messages:", error);
    }
  }, []);


  useEffect(() => {
    fetchAndUpdateMessages(); 
    const intervalId = setInterval(fetchAndUpdateMessages, 10000); 
    return () => clearInterval(intervalId);
  }, [fetchAndUpdateMessages]);

  // This is called when a new TOP-LEVEL message is committed from the main MessageForm
  const handleNewTopLevelMessageCommitted = (newMessage: Message) => {
    if (!newMessage.parentId) { // Should always be true for this form
      setMessages(prevMessages => [newMessage, ...prevMessages.filter(msg => msg.id !== newMessage.id)]);
    }
  };
  
  // This is called by MessageItem when ITSELF or one of ITS REPLIES causes an update
  // (e.g., its repost count changes, or a reply is made to it, incrementing its replyCount)
  const handleMessageItemUpdated = (updatedMessage: Message) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === updatedMessage.id) {
          return updatedMessage; // This updates the top-level message
        }
        // If the updatedMessage is a reply, its parent's replyCount might have changed.
        // The MessageItem itself handles incrementing its own replyCount and calling this.
        if (msg.id === updatedMessage.parentId) {
           // This case might be redundant if MessageItem calls onMessageUpdated with its own (parent) message
           // already having the incremented replyCount. Let's be safe.
          const parentToUpdate = prevMessages.find(p => p.id === updatedMessage.parentId);
          if(parentToUpdate) {
            // The child MessageItem should have passed the *updated parent* if its replyCount changed.
            // So, this path might not be strictly necessary if MessageItem is implemented correctly.
            // For now, we assume `updatedMessage` *is* the message from the `messages` array.
          }
        }
        return msg;
      })
    );
  };


  const handlePollCreated = (newPoll: Poll) => {
    setPolls(prevPolls => [newPoll, ...prevPolls.filter(p => p.id !== newPoll.id)]);
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
        {/* This form is for creating NEW TOP-LEVEL messages */}
        <MessageForm onMessageCommitted={handleNewTopLevelMessageCommitted} />
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
                onMessageUpdated={handleMessageItemUpdated}
                // onReplyCommitted is handled internally by MessageItem now for its own replies
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
