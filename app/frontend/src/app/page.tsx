import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await currentUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  // This return should never be reached due to redirects above
  return null;
}
