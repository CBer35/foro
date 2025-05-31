
import type { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  nickname: string;
  content: string;
  timestamp: Timestamp | Date; // Firestore uses Timestamp, client might use Date
  filePreview?: string; 
  fileName?: string;
  fileType?: string;
  reposts: number;
}

export interface PollOption {
  id: string; 
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  nickname: string;
  question: string;
  options: PollOption[];
  timestamp: Timestamp | Date; // Firestore uses Timestamp, client might use Date
  totalVotes: number;
}
