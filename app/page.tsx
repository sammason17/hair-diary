
import Calendar from "@/components/Calendar";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Hair Diary</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Logged in as: {session?.user?.name}</span>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Logout
            </button>
          </form>
        </div>
      </header>
      <Calendar />
    </main>
  );
}
