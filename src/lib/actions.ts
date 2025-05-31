
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addMessage, incrementMessageReposts, addPoll, voteOnPoll } from './file-store';
import type { Message, Poll, PollOption } from '@/types'; // PollOption might not be directly used here now

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
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  redirect('/forum');
}

export async function createMessageAction(formData: FormData) {
  const nickname = cookies().get('nickname')?.value;

  if (!nickname) {
     console.error('CreateMessageAction: Nickname cookie not found. Cookies:', cookies().getAll());
    return { error: 'User not authenticated. Please ensure you are properly logged in and cookies are enabled.' };
  }
  // console.log('CreateMessageAction: Nickname found:', nickname);
  // console.log('CreateMessageAction: All cookies:', cookies().getAll());


  const content = formData.get('content') as string;
  const file = formData.get('file') as File | null;

  if (!content || content.trim().length === 0) {
    return { error: 'Message content cannot be empty.' };
  }

  try {
    const messageData: Omit<Message, 'id' | 'timestamp' | 'reposts'> = {
      nickname,
      content,
      // reposts will be initialized by addMessage
    };

    if (file && file.size > 0) {
      messageData.fileName = file.name;
      messageData.fileType = file.type;
       if (formData.has('filePreview')) {
         messageData.filePreview = formData.get('filePreview') as string;
       }
    }
    
    await addMessage(messageData);

    revalidatePath('/forum'); 
    return { success: 'Message posted successfully!' };

  } catch (e) {
    console.error('Error posting message:', e);
    return { error: 'Failed to post message. Please try again.' };
  }
}

export async function repostMessageAction(messageId: string) {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }

  try {
    const updatedMessage = await incrementMessageReposts(messageId);
    if (!updatedMessage) {
      return { error: 'Message not found or failed to repost.'};
    }
    revalidatePath('/forum');
    return { success: 'Message reposted!' };
  } catch (e) {
    console.error('Error reposting message:', e);
    return { error: 'Failed to repost message.' };
  }
}

export async function createPollAction(formData: FormData) {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }
  const question = formData.get('question') as string;
  const optionTexts = (formData.getAll('options[]') as string[]).filter(opt => opt.trim() !== '');

  if (!question || question.trim().length === 0) {
    return { error: 'Poll question cannot be empty.' };
  }
  if (optionTexts.length < 2) {
    return { error: 'Poll must have at least two options.' };
  }
  
  try {
    const pollData = { // Omit<Poll, 'id' | 'timestamp' | 'totalVotes' | 'options'> & { options: string[] }
      nickname,
      question,
      options: optionTexts,
    };

    await addPoll(pollData);

    revalidatePath('/forum');
    return { success: 'Poll created successfully!' };
  } catch (e) {
    console.error('Error creating poll:', e);
    return { error: 'Failed to create poll.' };
  }
}

export async function votePollAction(pollId: string, optionId: string) {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }

  try {
    const updatedPoll = await voteOnPoll(pollId, optionId);
    if(!updatedPoll) {
      return { error: 'Poll or option not found, or failed to vote.'};
    }
    revalidatePath('/forum');
    return { success: 'Voted successfully!' };
  } catch (e) {
    console.error('Error voting on poll:', e);
    if (typeof e === 'string') {
      return { error: e };
    }
    return { error: 'Failed to vote on poll.' };
  }
}

export async function handleSignOut() {
  cookies().delete('nickname');
  redirect('/');
}
