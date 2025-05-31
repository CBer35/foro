'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const nicknameSchema = z.object({
  nickname: z.string().min(3, "Nickname must be at least 3 characters").max(20, "Nickname can be at most 20 characters long."),
});

export async function setNicknameAction(prevState: any, formData: FormData) {
  const validatedFields = nicknameSchema.safeParse({
    nickname: formData.get('nickname'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { nickname } = validatedFields.data;

  cookies().set('nickname', nickname, {
    httpOnly: true, // Recommended for security if not strictly needed client-side JS
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  redirect('/forum');
}

// Placeholder actions for messages and polls
// In a real app, these would interact with a database.

export async function createMessageAction(formData: FormData) {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }
  const content = formData.get('content') as string;
  const file = formData.get('file') as File | null;

  if (!content || content.trim().length === 0) {
    return { error: 'Message content cannot be empty.' };
  }

  console.log('New message from:', nickname);
  console.log('Content:', content);
  if (file && file.size > 0) {
    console.log('File:', file.name, file.size, file.type);
    // File handling logic would go here (e.g., upload to storage)
  }
  // Simulate successful creation
  revalidatePath('/forum'); // To update the list on the client
  return { success: 'Message posted successfully!' };
}

export async function repostMessageAction(messageId: string) {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }
  console.log('Message reposted:', messageId, 'by', nickname);
  // Simulate successful repost
  revalidatePath('/forum');
  return { success: 'Message reposted!' };
}

export async function createPollAction(formData: FormData) {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }
  const question = formData.get('question') as string;
  const options = (formData.getAll('options[]') as string[]).filter(opt => opt.trim() !== '');


  if (!question || question.trim().length === 0) {
    return { error: 'Poll question cannot be empty.' };
  }
  if (options.length < 2) {
    return { error: 'Poll must have at least two options.' };
  }
  
  console.log('New poll from:', nickname);
  console.log('Question:', question);
  console.log('Options:', options);
  // Simulate successful creation
  revalidatePath('/forum');
  return { success: 'Poll created successfully!' };
}

export async function votePollAction(pollId: string, optionId: string) {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }
  console.log('Vote cast for poll:', pollId, 'option:', optionId, 'by', nickname);
  // Simulate successful vote
  revalidatePath('/forum');
  return { success: 'Voted successfully!' };
}

export async function handleSignOut() {
  cookies().delete('nickname');
  redirect('/');
}
