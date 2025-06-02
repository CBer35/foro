
'use client';

import type { Message, UserPreference } from '@/types';
import { useState, useCallback } from 'react';
import AdminMessageItem from './AdminMessageItem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminMessageListProps {
  initialMessages: Message[];
  userPreferences: UserPreference[]; // Add user preferences
}

export default function AdminMessageList({ initialMessages, userPreferences }: AdminMessageListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [searchTerm, setSearchTerm] = useState('');

  // Create a map for quick preference lookup
  const preferencesMap = new Map(userPreferences.map(p => [p.nickname, p]));

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId && msg.parentId !== messageId));
  }, []);

  // onMessageUpdated is no longer needed here for badges/GIFs as they are per-user

  const filteredMessages = messages.filter(message => {
    const authorPref = preferencesMap.get(message.nickname);
    const contentMatch = message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const nicknameMatch = message.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = message.id.toLowerCase().includes(searchTerm.toLowerCase());
    const badgeMatch = authorPref?.badges?.some(badge => badge.toLowerCase().includes(searchTerm.toLowerCase()));
    return contentMatch || nicknameMatch || idMatch || badgeMatch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-card shadow-sm">
        <Label htmlFor="search-messages" className="text-sm font-medium">Search Messages</Label>
        <Input
          id="search-messages"
          type="text"
          placeholder="Search by content, nickname, ID, or user badge..."
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
        {filteredMessages.map((message) => {
          const authorPreference = preferencesMap.get(message.nickname);
          return (
            <AdminMessageItem 
              key={message.id} 
              message={message} 
              authorPreference={authorPreference}
              onMessageDeleted={handleMessageDeleted}
            />
          );
        })}
      </div>
    </div>
  );
}
