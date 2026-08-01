import { ConversationStudio } from "@/features/studio/conversation-studio";

export const metadata = { title: "Gesprächsstudio" };

export default async function StudioPage({
  searchParams,
}: PageProps<"/studio">) {
  const params = await searchParams;
  const requested = Number(params.topic);
  return (
    <ConversationStudio
      initialTopicIndex={
        Number.isInteger(requested) && requested >= 0 ? requested : 0
      }
    />
  );
}
