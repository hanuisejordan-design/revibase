import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGroupContext } from "@/features/groups/queries";
import { CreateClassForm } from "@/components/classes/create-class-form";

export const metadata: Metadata = { title: "Créer une classe" };

export default async function NewGroupClassPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const ctx = await getGroupContext(groupId);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/group/${groupId}`);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href={`/group/${groupId}`} className="text-xs text-zinc-500 hover:underline">
          ← {ctx.name}
        </Link>
        <h1 className="text-xl font-semibold">Créer une classe</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Elle sera rattachée au groupe « {ctx.name} » : tous ses membres y auront accès. Des
          chapitres par défaut sont créés — modifiables ensuite.
        </p>
      </div>
      <CreateClassForm groupId={groupId} />
    </div>
  );
}
