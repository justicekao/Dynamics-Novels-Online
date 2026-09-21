import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/app/(auth)/actions";
import { Button, Card, ErrorText, Field, PageTitle, TextInput } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/worlds");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageTitle subtitle="Welcome back.">Log in</PageTitle>
      <Card>
        <ErrorText>{error}</ErrorText>
        <form action={loginAction}>
          <Field label="Email or username">
            <TextInput type="text" name="identifier" required autoComplete="username" />
          </Field>
          <Field label="Password">
            <TextInput type="password" name="password" required autoComplete="current-password" />
          </Field>
          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-slate-400">
        Need an account?{" "}
        <Link href="/signup" className="text-amber-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
