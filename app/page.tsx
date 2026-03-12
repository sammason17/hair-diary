
import Calendar from "@/components/Calendar";
import { getAuth, devSignOut } from "@/lib/devAuth";
import { redirect } from "next/navigation";

const USE_REAL_DB = process.env.USE_REAL_DB === "true";

export default async function HomePage() {
  const session = await getAuth();

  // In development mode, always allow access (don't redirect)
  // In production mode, redirect if not authenticated
  if (!session && USE_REAL_DB) {
    redirect("/login");
  }

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Hair Diary</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {USE_REAL_DB
              ? `Logged in as: ${session?.user?.name}`
              : `Development Mode - ${session?.user?.name}`}
          </span>
          {USE_REAL_DB && (
            <form action={async () => {
              "use server";
              await devSignOut({ redirectTo: "/login" });
            }}>
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Logout
              </button>
            </form>
          )}
        </div>
      </header>
      <Calendar />
    </main>
  );
}
