/**
 * lib/auth.ts
 * Server-side auth helpers using Clerk.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';
import { redirect } from 'next/navigation';

/**
 * Get the current Clerk user ID — throws if not authenticated.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return userId;
}

/**
 * Get or create the DB user record from Clerk.
 */
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await db.user.upsert({
    where: { clerkId: userId },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return user;
}

/**
 * Get the current user's subscription plan.
 */
export async function getUserPlan(): Promise<'FREE' | 'PRO' | 'PREMIUM'> {
  const { userId } = await auth();
  if (!userId) return 'FREE';

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { plan: true },
  });

  return user?.plan ?? 'FREE';
}
