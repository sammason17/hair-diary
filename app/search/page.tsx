import SearchPage from "@/components/SearchPage";
import { getAuth, devSignOut } from "@/lib/devAuth";
import { redirect } from "next/navigation";
import Link from "next/link";

const USE_REAL_DB = process.env.USE_REAL_DB === "true";

export default async function Search() {
  const session = await getAuth();

  if (!session && USE_REAL_DB) {
    redirect("/login");
  }

  const currentUser = session?.user?.name ?? "stewart";

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-all">
            ← Calendar
          </Link>
          <h1 className="text-2xl font-semibold">Search Appointments</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {USE_REAL_DB
              ? `Logged in as: ${currentUser}`
              : `Development Mode - ${currentUser}`}
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
      <SearchPage currentUser={currentUser} />
    </main>
  );
}
