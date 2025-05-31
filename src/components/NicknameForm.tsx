'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect } from 'react'; // Updated import
import { setNicknameAction } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  const [state, formAction] = useActionState(setNicknameAction, initialState); // Updated hook
  const { toast } = useToast();

  useEffect(() => {
    if (state?.errors?.nickname) {
      toast({
        title: "Validation Error",
        description: (state.errors.nickname as string[]).join(', '), // Added type assertion
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
          <p className="text-sm text-destructive mt-1">{(state.errors.nickname as string[]).join(', ')}</p> // Added type assertion
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
