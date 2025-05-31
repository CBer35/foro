
'use client';

import { useState } from 'react';
import type { Poll } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ThumbsUp, BarChartBig } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { votePollAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface PollItemProps {
  poll: Poll;
  currentNickname: string;
  onPollUpdated: (updatedPoll: Poll) => void;
}

export default function PollItem({ poll, currentNickname, onPollUpdated }: PollItemProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleVote = async () => {
    if (!selectedOptionId) {
      toast({ title: "No Selection", description: "Please select an option to vote.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await votePollAction(poll.id, selectedOptionId);
    if (result?.success && result.updatedPoll) {
      toast({ title: "Success", description: result.success });
      onPollUpdated(result.updatedPoll); 
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSubmitting(false);
    setSelectedOptionId(null); 
  };

  return (
    <Card className="mb-6 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChartBig className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl font-semibold">{poll.question}</CardTitle>
        </div>
        <CardDescription>
          Posted by {poll.nickname} • {formatDistanceToNow(new Date(poll.timestamp), { addSuffix: true })} • {poll.totalVotes} vote(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <RadioGroup
          value={selectedOptionId ?? undefined}
          onValueChange={setSelectedOptionId}
          className="space-y-2 mb-4"
        >
          {poll.options.map((option) => {
            const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-secondary/30 transition-colors">
                  <RadioGroupItem value={option.id} id={`${poll.id}-${option.id}`} />
                  <Label htmlFor={`${poll.id}-${option.id}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                  <span className="text-sm text-muted-foreground">({option.votes} votes)</span>
                </div>
                <Progress value={percentage} className="h-2 [&>div]:bg-accent" aria-label={`${percentage.toFixed(0)}% for ${option.text}`} />
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button onClick={handleVote} disabled={!selectedOptionId || isSubmitting} className="w-full">
          <ThumbsUp className="mr-2 h-4 w-4" /> {isSubmitting ? 'Voting...' : 'Vote'}
        </Button>
      </CardFooter>
    </Card>
  );
}
