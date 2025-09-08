import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await currentUser();

  // Always redirect - either to dashboard if logged in, or login if not
  if (user) {
    redirect('/dashboard');
  }
  
  redirect('/login');
}
