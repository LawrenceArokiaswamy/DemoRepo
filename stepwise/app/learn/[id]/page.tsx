import { notFound } from "next/navigation";
import { LearnSession } from "@/components/learn-session";
import { getStore } from "@/src/store/db";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = getStore().getCourse(id);
  if (!course) notFound();
  return <LearnSession courseId={course.id} courseTitle={course.title} />;
}
