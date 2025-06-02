
'use client';

import type { Message } from '@/types';
import { useState } from 'react';
import AdminMessageItem from './AdminMessageItem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminMessageListProps {
  initialMessages: Message[];
}

export default function AdminMessageList({ initialMessages }: AdminMessageListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [searchTerm, setSearchTerm] = useState('');

  const handleMessageDeleted = (messageId: string) => {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId && msg.parentId !== messageId));
     // Also filter out replies if a parent was deleted, though server action handles the file.
     // This is for optimistic UI update.
  };

  const filteredMessages = messages.filter(message => {
    const contentMatch = message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const nicknameMatch = message.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = message.id.toLowerCase().includes(searchTerm.toLowerCase());
    return contentMatch || nicknameMatch || idMatch;
  });

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-card shadow-sm">
        <Label htmlFor="search-messages" className="text-sm font-medium">Search Messages</Label>
        <Input
          id="search-messages"
          type="text"
          placeholder="Search by content, nickname, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1"
        />
      </div>
      {filteredMessages.length === 0 && searchTerm && (
         <p className="text-muted-foreground text-center py-4">No messages match your search criteria.</p>
      )}
      {filteredMessages.length === 0 && !searchTerm && (
         <p className="text-muted-foreground text-center py-4">No messages to display.</p>
      )}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <AdminMessageItem 
            key={message.id} 
            message={message} 
            onMessageDeleted={handleMessageDeleted} 
          />
        ))}
      </div>
    </div>
  );
}
