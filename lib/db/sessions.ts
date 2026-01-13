/**
 * Review session database operations
 * CRUD operations for managing review sessions in IndexedDB
 */

import { getDB } from './schema';
import { DB_CONFIG } from '@/lib/constants/app';
import type { ReviewSession } from '@/lib/types';

/**
 * Creates a new review session in the database
 * 
 * @param session - The review session to create
 * @returns Promise resolving to the created session
 */
export async function createSession(
  session: ReviewSession
): Promise<ReviewSession> {
  const db = await getDB();
  await db.add(DB_CONFIG.STORES.SESSIONS, session);
  return session;
}

/**
 * Retrieves a session by ID
 * 
 * @param id - The session ID
 * @returns Promise resolving to the session or undefined if not found
 */
export async function getSession(
  id: string
): Promise<ReviewSession | undefined> {
  const db = await getDB();
  return db.get(DB_CONFIG.STORES.SESSIONS, id);
}

/**
 * Retrieves all review sessions
 * 
 * @returns Promise resolving to array of all sessions
 */
export async function getAllSessions(): Promise<ReviewSession[]> {
  const db = await getDB();
  return db.getAll(DB_CONFIG.STORES.SESSIONS);
}

/**
 * Retrieves sessions for a specific date range
 * 
 * @param startTime - Start timestamp (inclusive)
 * @param endTime - End timestamp (inclusive)
 * @returns Promise resolving to array of sessions in range
 */
export async function getSessionsInRange(
  startTime: number,
  endTime: number
): Promise<ReviewSession[]> {
  const db = await getDB();
  const allSessions = await db.getAll(DB_CONFIG.STORES.SESSIONS);
  
  return allSessions.filter(
    (session) => session.startTime >= startTime && session.startTime <= endTime
  );
}

/**
 * Retrieves sessions for today
 * 
 * @returns Promise resolving to array of today's sessions
 */
export async function getTodaySessions(): Promise<ReviewSession[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  return getSessionsInRange(startOfDay.getTime(), endOfDay.getTime());
}

/**
 * Updates an existing review session
 * 
 * @param session - The updated session data
 * @returns Promise resolving to the updated session
 */
export async function updateSession(
  session: ReviewSession
): Promise<ReviewSession> {
  const db = await getDB();
  await db.put(DB_CONFIG.STORES.SESSIONS, session);
  return session;
}

/**
 * Deletes a review session
 * 
 * @param id - The session ID to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(DB_CONFIG.STORES.SESSIONS, id);
}

/**
 * Counts total review sessions
 * 
 * @returns Promise resolving to the count
 */
export async function countSessions(): Promise<number> {
  const db = await getDB();
  return db.count(DB_CONFIG.STORES.SESSIONS);
}

/**
 * Counts sessions for today
 * 
 * @returns Promise resolving to the count
 */
export async function countTodaySessions(): Promise<number> {
  const sessions = await getTodaySessions();
  return sessions.length;
}

/**
 * Calculates total cards reviewed today
 * 
 * @returns Promise resolving to the count
 */
export async function countCardsReviewedToday(): Promise<number> {
  const sessions = await getTodaySessions();
  return sessions.reduce((total, session) => total + session.cardsReviewed, 0);
}

/**
 * Calculates average accuracy for today
 * 
 * @returns Promise resolving to the accuracy rate (0-1) or 0 if no sessions
 */
export async function calculateTodayAccuracy(): Promise<number> {
  const sessions = await getTodaySessions();
  
  if (sessions.length === 0) {
    return 0;
  }
  
  const totalAccuracy = sessions.reduce(
    (sum, session) => sum + session.accuracyRate, 
    0
  );
  
  return totalAccuracy / sessions.length;
}

/**
 * Gets the most recent N sessions
 * 
 * @param count - Number of recent sessions to retrieve
 * @returns Promise resolving to array of recent sessions
 */
export async function getRecentSessions(count: number = 10): Promise<ReviewSession[]> {
  const db = await getDB();
  const allSessions = await db.getAll(DB_CONFIG.STORES.SESSIONS);
  
  // Sort by start time descending (most recent first)
  return allSessions
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, count);
}

