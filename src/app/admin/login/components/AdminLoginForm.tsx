
'use client';

import { useFormStatus, useFormState } from 'react-dom';
import { useEffect } from 'react';
import { adminLoginAction } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

const initialState = {
  error: null,
  errors: null, // for field-specific errors if we add them
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending} disabled={pending}>
      {pending ? 'Logging in...' : <>Login <LogIn className="ml-2 h-4 w-4" /></>}
    </Button>
  );
}

export default function AdminLoginForm() {
  const [state, formAction] = useFormState(adminLoginAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        title: "Login Failed",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="admin_username"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="********"
          required
          className="mt-1"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
