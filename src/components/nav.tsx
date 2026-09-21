import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-amber-400">
          Dynamics Novels Online
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link href="/worlds" className="hover:text-amber-400">
            Worlds
          </Link>
          <Link href="/worlds?tab=players" className="hover:text-amber-400">
            Players
          </Link>
          <Link href="/worlds?tab=favorites" className="hover:text-amber-400">
            Favorites
          </Link>
          {user ? (
            <>
              <Link href="/worlds/new" className="hover:text-amber-400">
                New World
              </Link>
              <Link href={`/users/${user.username}`} className="hover:text-amber-400">
                {user.username}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="hover:text-amber-400">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-amber-400">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-amber-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-amber-400"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
