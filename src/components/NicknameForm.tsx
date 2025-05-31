'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { setNicknameAction } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

const initialState = {
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending} disabled={pending}>
      {pending ? 'Saving...' : <>Enter Forum <Send className="ml-2 h-4 w-4" /></>}
    </Button>
  );
}

export default function NicknameForm() {
  const [state, formAction] = useFormState(setNicknameAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.errors?.nickname) {
      toast({
        title: "Validation Error",
        description: state.errors.nickname.join(', '),
        variant: "destructive",
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="nickname" className="sr-only">Seudónimo</Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          placeholder="Your Nickname"
          required
          minLength={3}
          maxLength={20}
          className="text-lg"
        />
        {state?.errors?.nickname && (
          <p className="text-sm text-destructive mt-1">{state.errors.nickname.join(', ')}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
