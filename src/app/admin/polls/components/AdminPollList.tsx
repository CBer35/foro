
'use client';

import type { Poll } from '@/types';
import { useState } from 'react';
import AdminPollItem from './AdminPollItem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminPollListProps {
  initialPolls: Poll[];
}

export default function AdminPollList({ initialPolls }: AdminPollListProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePollDeleted = (pollId: string) => {
    setPolls(prevPolls => prevPolls.filter(poll => poll.id !== pollId));
  };

  const filteredPolls = polls.filter(poll => {
    const questionMatch = poll.question.toLowerCase().includes(searchTerm.toLowerCase());
    const nicknameMatch = poll.nickname.toLowerCase().includes(searchTerm.toLowerCase()); // "Admin" usually
    const idMatch = poll.id.toLowerCase().includes(searchTerm.toLowerCase());
    return questionMatch || nicknameMatch || idMatch;
  });


  return (
    <div className="space-y-6">
       <div className="p-4 border rounded-lg bg-card shadow-sm">
        <Label htmlFor="search-polls" className="text-sm font-medium">Search Polls</Label>
        <Input
          id="search-polls"
          type="text"
          placeholder="Search by question, nickname, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1"
        />
      </div>
      {filteredPolls.length === 0 && searchTerm && (
         <p className="text-muted-foreground text-center py-4">No polls match your search criteria.</p>
      )}
       {/* No explicit message for "no polls to display" when search is empty, as page.tsx handles "No polls found" globally */}
      <div className="space-y-4">
        {filteredPolls.map((poll) => (
          <AdminPollItem 
            key={poll.id} 
            poll={poll} 
            onPollDeleted={handlePollDeleted} 
          />
        ))}
      </div>
    </div>
  );
}
