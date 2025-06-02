
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Message, Poll } from '@/types';

const dataDir = path.join(process.cwd(), 'data');
const messagesFilePath = path.join(dataDir, 'messages.json');
const pollsFilePath = path.join(dataDir, 'polls.json');

async function ensureDataDirExists() {
  try {
    await fs.access(dataDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
    }
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readFileData<T>(filePath: string): Promise<T[]> {
  await ensureDataDirExists();
  try {
    await fs.access(filePath); 
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (fileContent.trim() === '') return []; 
    return JSON.parse(fileContent) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading or parsing ${filePath}:`, error);
    return []; 
  }
}

async function writeFileData<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDirExists();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error; 
  }
}

// Messages
export async function getMessages(includeRepliesFlat: boolean = false): Promise<Message[]> {
  const messages = await readFileData<Message>(messagesFilePath);
  if (includeRepliesFlat) {
    return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  return messages
    .filter(msg => !msg.parentId) 
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getAllMessagesWithReplies(): Promise<Message[]> {
  const messages = await readFileData<Message>(messagesFilePath);
  return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}


export async function addMessage(
  messageDetails: Omit<Message, 'id' | 'timestamp' | 'reposts' | 'replyCount' | 'badges' | 'messageBackgroundGif'> & { parentId?: string }
): Promise<Message> {
  const messages = await readFileData<Message>(messagesFilePath);

  const newMessage: Message = {
    nickname: messageDetails.nickname,
    content: messageDetails.content,
    filePreview: messageDetails.filePreview,
    fileName: messageDetails.fileName,
    fileType: messageDetails.fileType,
    fileUrl: messageDetails.fileUrl,
    videoEmbedUrl: messageDetails.videoEmbedUrl,
    parentId: messageDetails.parentId,
    ipAddress: messageDetails.ipAddress,
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    reposts: 0,
    replyCount: 0,
    badges: [], // Initialize with empty badges
    messageBackgroundGif: undefined, // Initialize with no background
  };

  messages.push(newMessage);

  if (newMessage.parentId) {
    const parentMessageIndex = messages.findIndex(m => m.id === newMessage.parentId);
    if (parentMessageIndex > -1) {
      messages[parentMessageIndex].replyCount = (messages[parentMessageIndex].replyCount || 0) + 1;
    } else {
      console.warn(`Parent message with id ${newMessage.parentId} not found for reply ${newMessage.id}`);
    }
  }

  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  await writeFileData<Message>(messagesFilePath, messages);
  return newMessage;
}

export async function incrementMessageReposts(messageId: string): Promise<Message | null> {
  let messages = await readFileData<Message>(messagesFilePath);
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex > -1) {
    messages[messageIndex].reposts = (messages[messageIndex].reposts || 0) + 1;
    await writeFileData<Message>(messagesFilePath, messages);
    return messages[messageIndex];
  }
  return null;
}

export async function deleteMessageAndReplies(messageIdToDelete: string): Promise<boolean> {
  let messages = await readFileData<Message>(messagesFilePath);
  const originalLength = messages.length;

  const messageToDelete = messages.find(m => m.id === messageIdToDelete);
  if (!messageToDelete) return false;

  const idsToDelete = new Set<string>();
  idsToDelete.add(messageIdToDelete);

  if (!messageToDelete.parentId) {
    messages.forEach(msg => {
      if (msg.parentId === messageIdToDelete) {
        idsToDelete.add(msg.id);
      }
    });
  }
  
  messages = messages.filter(m => !idsToDelete.has(m.id));

  if (messageToDelete.parentId) {
    const parentIndex = messages.findIndex(m => m.id === messageToDelete.parentId);
    if (parentIndex > -1) {
      messages[parentIndex].replyCount = Math.max(0, (messages[parentIndex].replyCount || 0) - 1);
    }
  }
  
  await writeFileData<Message>(messagesFilePath, messages);
  return messages.length < originalLength;
}

export async function updateMessageBadges(messageId: string, newBadges: string[]): Promise<Message | null> {
  let messages = await readFileData<Message>(messagesFilePath);
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex > -1) {
    messages[messageIndex].badges = [...newBadges]; // Ensure it's a new array
    await writeFileData<Message>(messagesFilePath, messages);
    return messages[messageIndex];
  }
  return null;
}

export async function updateMessageBackgroundGif(messageId: string, gifUrl: string | null): Promise<Message | null> {
  let messages = await readFileData<Message>(messagesFilePath);
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex > -1) {
    messages[messageIndex].messageBackgroundGif = gifUrl ?? undefined;
    await writeFileData<Message>(messagesFilePath, messages);
    return messages[messageIndex];
  }
  return null;
}


// Polls
export async function getPolls(): Promise<Poll[]> {
  const polls = await readFileData<Poll>(pollsFilePath);
  return polls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addPoll(pollData: Omit<Poll, 'id' | 'timestamp' | 'totalVotes' | 'options'> & { options: string[], ipAddress?: string }): Promise<Poll> {
  const polls = await getPolls();
  const newPoll: Poll = {
    id: `poll_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    nickname: pollData.nickname,
    question: pollData.question,
    options: pollData.options.map((text, index) => ({
      id: `opt_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`,
      text,
      votes: 0,
    })),
    ipAddress: pollData.ipAddress,
    timestamp: new Date().toISOString(),
    totalVotes: 0,
  };
  polls.unshift(newPoll); 
  await writeFileData<Poll>(pollsFilePath, polls);
  return newPoll;
}

export async function voteOnPoll(pollId: string, optionId: string): Promise<Poll | null> {
  let polls = await getPolls();
  const pollIndex = polls.findIndex(p => p.id === pollId);
  if (pollIndex > -1) {
    const currentPoll = polls[pollIndex];
    const optionIndex = currentPoll.options.findIndex(o => o.id === optionId);
    if (optionIndex > -1) {
      currentPoll.options[optionIndex].votes += 1;
      currentPoll.totalVotes += 1;
      await writeFileData<Poll>(pollsFilePath, polls);
      return currentPoll;
    } else {
      console.error(`Option ${optionId} not found in poll ${pollId}`);
      return null;
    }
  }
   console.error(`Poll ${pollId} not found for voting`);
  return null;
}

export async function deletePoll(pollIdToDelete: string): Promise<boolean> {
  let polls = await getPolls();
  const originalLength = polls.length;
  polls = polls.filter(p => p.id !== pollIdToDelete);
  
  if (polls.length < originalLength) {
    await writeFileData<Poll>(pollsFilePath, polls);
    return true;
  }
  return false;
}

