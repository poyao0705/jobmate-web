/**
 * Profile Page
 * 
 * User profile page with contact information and resume upload functionality.
 * Shows proper error handling, loading states, and TypeScript type safety.
 */

import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  return <ProfileClient />;
}
