import { getChatGPTUser } from "./chatgpt-auth";
import StudyTracker from "./study-tracker";

export default async function Home() {
  const user = await getChatGPTUser();
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
  }).format(new Date());

  return <StudyTracker displayName={user?.displayName ?? null} today={today} />;
}
