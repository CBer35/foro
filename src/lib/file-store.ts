
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Message, Poll, UserPreference } from '@/types';

const dataDir = path.join(process.cwd(), 'data');
const messagesFilePath = path.join(dataDir, 'messages.json');
const pollsFilePath = path.join(dataDir, 'polls.json');
const userPreferencesFilePath = path.join(dataDir, 'user_preferences.json');

const uploadsDirPublic = path.join(process.cwd(), 'public', 'uploads');
const messageBackgroundsDirPublic = path.join(uploadsDirPublic, 'message-backgrounds'); // To be deprecated for direct use
const userBackgroundsDirPublic = path.join(uploadsDirPublic, 'user-backgrounds');


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

async function ensureUploadsDirsExist() {
  try {
    await fs.access(uploadsDirPublic);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(uploadsDirPublic, { recursive: true });
    } else { throw error; }
  }
  // Ensure specific subdirectories exist
  for (const dir of [messageBackgroundsDirPublic, userBackgroundsDirPublic]) {
    try {
      await fs.access(dir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.mkdir(dir, { recursive: true });
      } else { throw error; }
    }
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
      await fs.writeFile(filePath, JSON.stringify([]), 'utf-8'); // Create file if not exists
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
    // badges and messageBackgroundGif are no longer part of Message type for individual messages
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

  if (messageToDelete.fileUrl && !messageToDelete.videoEmbedUrl) { 
    const filePath = path.join(uploadsDirPublic, path.basename(messageToDelete.fileUrl));
    try { await fs.unlink(filePath); } catch (e) { console.warn(`Could not delete file ${filePath}:`, e); }
  }
  // No longer deleting message-specific background GIFs as they don't exist on Message type

  const idsToDelete = new Set<string>();
  idsToDelete.add(messageIdToDelete);

  if (!messageToDelete.parentId) {
    messages.forEach(msg => {
      if (msg.parentId === messageIdToDelete) {
        idsToDelete.add(msg.id);
        if (msg.fileUrl && !msg.videoEmbedUrl) {
          const replyFilePath = path.join(uploadsDirPublic, path.basename(msg.fileUrl));
          try { fs.unlink(replyFilePath); } catch (e) { console.warn(`Could not delete reply file ${replyFilePath}:`, e); }
        }
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

// User Preferences
export async function getUserPreferences(): Promise<UserPreference[]> {
  return readFileData<UserPreference>(userPreferencesFilePath);
}

export async function writeUserPreferences(preferences: UserPreference[]): Promise<void> {
  await writeFileData<UserPreference>(userPreferencesFilePath, preferences);
}

export async function upsertUserPreference(
  nickname: string, 
  badges?: string[], 
  backgroundGifUrl?: string | null // null means remove
): Promise<UserPreference> {
  await ensureUploadsDirsExist(); // Ensure user-backgrounds dir exists
  let preferences = await getUserPreferences();
  const prefIndex = preferences.findIndex(p => p.nickname === nickname);

  let updatedPref: UserPreference;

  if (prefIndex > -1) {
    updatedPref = { ...preferences[prefIndex] };
    if (badges !== undefined) {
      updatedPref.badges = badges;
    }
    if (backgroundGifUrl !== undefined) { // If undefined, don't touch; if null, clear; if string, set.
      updatedPref.backgroundGifUrl = backgroundGifUrl === null ? undefined : backgroundGifUrl;
    }
    preferences[prefIndex] = updatedPref;
  } else {
    updatedPref = { 
      nickname, 
      badges: badges || [], 
      backgroundGifUrl: backgroundGifUrl === null ? undefined : backgroundGifUrl 
    };
    preferences.push(updatedPref);
  }

  await writeUserPreferences(preferences);
  return updatedPref;
}

export async function deleteUserBackgroundGifFile(filePathToDelete: string | undefined): Promise<void> {
  if (!filePathToDelete) return;
  try {
    // filePathToDelete is like /uploads/user-backgrounds/filename.gif
    // We need the absolute path to delete
    const absolutePath = path.join(process.cwd(), 'public', filePathToDelete);
    await fs.unlink(absolutePath);
    console.log(`Successfully deleted user background GIF: ${absolutePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`User background GIF file not found for deletion (may have already been deleted): ${filePathToDelete}`);
    } else {
      console.error(`Error deleting user background GIF file ${filePathToDelete}:`, error);
    }
  }
}
