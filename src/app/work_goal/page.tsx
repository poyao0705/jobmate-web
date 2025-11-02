import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { TaskSchedulerClient } from '@/components/task/TaskSchedulerClient';

export default async function WorkGoalPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <TaskSchedulerClient />
    </div>
  );

}
