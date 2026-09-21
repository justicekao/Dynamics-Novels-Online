import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signupAction } from "@/app/(auth)/actions";
import { Button, Card, ErrorText, Field, PageTitle, TextInput } from "@/components/ui";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/worlds");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <PageTitle subtitle="Create an account to build and play worlds.">Sign up</PageTitle>
      <Card>
        <ErrorText>{error}</ErrorText>
        <form action={signupAction}>
          <Field label="Email">
            <TextInput type="email" name="email" required autoComplete="email" />
          </Field>
          <Field label="Username" hint="3-20 characters: letters, numbers, underscores.">
            <TextInput type="text" name="username" required autoComplete="username" />
          </Field>
          <Field label="Password" hint="At least 8 characters.">
            <TextInput type="password" name="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-400 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
