"use server";

import { revalidateTag } from "next/cache";

/**
 * Revalidates the saved-jobs cache tag.
 * This ensures any server-rendered views stay fresh after mutations.
 */
export async function revalidateSavedJobs() {
	revalidateTag("saved-jobs");
}

