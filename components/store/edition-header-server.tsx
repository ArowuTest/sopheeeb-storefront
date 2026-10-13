import { listPublicStoryCollections } from "@/lib/data/stories";

import { EditionHeader } from "./edition-header";

export async function EditionHeaderServer() {
  const collections = await listPublicStoryCollections();
  return <EditionHeader collections={collections.map((collection) => ({ slug: collection.slug, title: collection.title }))}/>;
}
