
import Calendar from "@/components/Calendar";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Hair Diary</h1>
        <Link href="/login" className="text-sm text-blue-600 underline">Login</Link>
      </header>
      <Calendar />
    </main>
  );
}
