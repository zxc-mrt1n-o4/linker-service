import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { dbClient } from './db-client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function getUserFromToken(token: string) {
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  // Set token for database client
  dbClient.setToken(token)
  
  // Get user from external database API
  const response = await dbClient.verifyToken()
  if (response.error || !response.data) return null
  
  return response.data.user
}
