import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatHelpPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }
  return <ChatClient />;
}