import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to CryptIoMT</h1>
      <p className="mt-4 text-lg text-gray-600">Please sign in to continue</p>
      <a 
        href="/login" 
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Sign In
      </a>
    </main>
  );
}
