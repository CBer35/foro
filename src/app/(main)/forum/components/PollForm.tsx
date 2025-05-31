'use client';

import { useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createPollAction } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, ListPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PollFormProps {
  onPollCreated: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Creating Poll...' : <><ListPlus className="mr-2 h-4 w-4" /> Create Poll</>}
    </Button>
  );
}

export default function PollForm({ onPollCreated }: PollFormProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']); // Start with two empty options
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) { // Max 10 options
      setOptions([...options, '']);
    } else {
      toast({ title: "Limit Reached", description: "Maximum of 10 options allowed.", variant: "destructive" });
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) { // Min 2 options
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    } else {
      toast({ title: "Minimum Options", description: "A poll must have at least 2 options.", variant: "destructive" });
    }
  };

  const handleSubmit = async (formData: FormData) => {
    const result = await createPollAction(formData);
    if (result?.success) {
      toast({ title: "Success", description: result.success });
      setQuestion('');
      setOptions(['', '']);
      formRef.current?.reset();
      onPollCreated();
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6 mb-8 p-4 border rounded-lg shadow-sm bg-card">
      <div>
        <Label htmlFor="question" className="font-semibold">Poll Question</Label>
        <Input
          id="question"
          name="question"
          placeholder="What do you want to ask?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      <div className="space-y-3">
        <Label className="font-semibold">Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              name="options[]" // Use array notation for multiple options
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              required
            />
            {options.length > 2 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} aria-label="Remove option">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={options.length >= 10}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Option
        </Button>
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

