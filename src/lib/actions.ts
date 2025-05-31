
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, runTransaction } from 'firebase/firestore';
import type { Message, Poll, PollOption } from '@/types';

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
    return { error: 'User not authenticated. Please ensure you are properly logged in and cookies are enabled.' };
  }

  const content = formData.get('content') as string;
  const file = formData.get('file') as File | null;

  if (!content || content.trim().length === 0) {
    return { error: 'Message content cannot be empty.' };
  }

  try {
    const messageData: Omit<Message, 'id' | 'timestamp'> = {
      nickname,
      content,
      reposts: 0,
    };

    if (file && file.size > 0) {
      // For now, we're just storing file metadata. Actual file upload to Firebase Storage would be a separate step.
      messageData.fileName = file.name;
      messageData.fileType = file.type;
      // If it's an image, you might generate a preview Data URL on client and pass it,
      // or handle preview generation after upload to storage.
      // For simplicity, if you pass filePreview from client, it would be a string.
      // This example assumes filePreview would be passed in formData if client generated it.
      // Let's assume client handles preview and MessageForm sends 'filePreview' in FormData if it's an image.
       if (formData.has('filePreview')) {
         messageData.filePreview = formData.get('filePreview') as string;
       }
    }
    
    await addDoc(collection(db, 'messages'), {
      ...messageData,
      timestamp: serverTimestamp(), // Use Firestore server timestamp
    });

    revalidatePath('/forum'); // May not be strictly necessary with real-time listeners, but good for fallback
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
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      reposts: increment(1),
    });
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
    const options: PollOption[] = optionTexts.map((text, index) => ({
      id: `opt_${Date.now()}_${index}`, // Simple unique ID for option within the poll
      text,
      votes: 0,
    }));

    const pollData: Omit<Poll, 'id' | 'timestamp'> = {
      nickname,
      question,
      options,
      totalVotes: 0,
    };

    await addDoc(collection(db, 'polls'), {
      ...pollData,
      timestamp: serverTimestamp(),
    });

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
    const pollRef = doc(db, 'polls', pollId);
    
    // It's safer to use a transaction to read and then update poll options
    await runTransaction(db, async (transaction) => {
      const pollDoc = await transaction.get(pollRef);
      if (!pollDoc.exists()) {
        throw "Poll not found!";
      }

      const pollData = pollDoc.data() as Poll;
      const optionIndex = pollData.options.findIndex(opt => opt.id === optionId);

      if (optionIndex === -1) {
        throw "Option not found!";
      }

      // Create a new options array with updated votes
      const newOptions = pollData.options.map((opt, index) => {
        if (index === optionIndex) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });
      
      transaction.update(pollRef, { 
        options: newOptions,
        totalVotes: increment(1) 
      });
    });

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
