import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createWorldAction } from "@/app/worlds/actions";
import { Button, Card, ErrorText, Field, PageTitle, TextArea, TextInput } from "@/components/ui";

export default async function NewWorldPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <PageTitle subtitle="Start from a blank world. You'll define races, classes, skills, locations, dungeons and events next.">
        Create a world
      </PageTitle>
      <Card>
        <ErrorText>{error}</ErrorText>
        <form action={createWorldAction}>
          <Field label="World name">
            <TextInput name="name" required placeholder="The Shattered Reaches" />
          </Field>
          <Field label="Description" hint="Shown to other players once you publish.">
            <TextArea name="description" placeholder="What is this world about?" />
          </Field>
          <Button type="submit" className="w-full">
            Create &amp; open builder
          </Button>
        </form>
      </Card>
    </div>
  );
}
