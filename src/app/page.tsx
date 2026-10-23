import { Experience } from "@/components/Experience";
import { readPosts } from "@/lib/posts/store";

/** Re-rendered whenever a post is published from /admin, and at least every ten minutes. */
export const revalidate = 600;

export default async function Home() {
  return <Experience posts={await readPosts()} />;
}
