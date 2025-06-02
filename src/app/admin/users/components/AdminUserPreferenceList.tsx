
'use client';

import type { UserPreference } from '@/types';
import { useState, useEffect } from 'react';
import AdminUserPreferenceItem from './AdminUserPreferenceItem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminUserPreferenceListProps {
  nicknames: string[];
  initialPreferences: UserPreference[];
}

export default function AdminUserPreferenceList({ nicknames, initialPreferences }: AdminUserPreferenceListProps) {
  const [preferences, setPreferences] = useState<UserPreference[]>(initialPreferences);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);
  
  const handlePreferenceUpdated = (updatedPreference: UserPreference) => {
    setPreferences(prev => 
      prev.map(p => p.nickname === updatedPreference.nickname ? updatedPreference : p)
          .filter(p => p.nickname) // Ensure nickname exists
    );
     // If the updated preference was for a nickname not yet in the list (e.g., first time setting for a user)
    if (!preferences.find(p => p.nickname === updatedPreference.nickname) && updatedPreference.nickname) {
      setPreferences(prev => [...prev, updatedPreference]);
    }
  };

  const filteredNicknames = nicknames.filter(nickname => 
    nickname.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort();

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-card shadow-sm">
        <Label htmlFor="search-nicknames" className="text-sm font-medium">Search Nicknames</Label>
        <Input
          id="search-nicknames"
          type="text"
          placeholder="Search by nickname..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1"
        />
      </div>
      {filteredNicknames.length === 0 && searchTerm && (
         <p className="text-muted-foreground text-center py-4">No nicknames match your search criteria.</p>
      )}
      <div className="space-y-4">
        {filteredNicknames.map((nickname) => {
          const currentPref = preferences.find(p => p.nickname === nickname);
          return (
            <AdminUserPreferenceItem 
              key={nickname} 
              nickname={nickname}
              initialPreference={currentPref}
              onPreferenceUpdated={handlePreferenceUpdated}
            />
          );
        })}
      </div>
    </div>
  );
}
