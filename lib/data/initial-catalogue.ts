import type { StorefrontStory, StorefrontStoryCollection } from "./stories";

/**
 * Source-informed launch preview based on public @sopheeeb TikTok posts.
 * These records are used only before the isolated Creator Studio database is
 * configured; setup adopts them as private drafts for Sophiee to review.
 */
const categories = [
  { id: "initial-wear", slug: "wear", title: "Wear", description: "Easy pieces, outfits and layers worth seeing in motion before you add them to your wardrobe.", imageUrl: "/creator-content/sophiee/coat.jpg", displayOrder: 1 },
  { id: "initial-home", slug: "home", title: "Home", description: "Small upgrades that make a room feel more considered, useful and yours.", imageUrl: "/creator-content/sophiee/home-decor.jpg", displayOrder: 2 },
  { id: "initial-beauty", slug: "beauty", title: "Beauty", description: "Hair, makeup and finishing touches shown in the routine—not just in a product photo.", imageUrl: "/creator-content/sophiee/wig.jpg", displayOrder: 3 },
  { id: "initial-move", slug: "move", title: "Move", description: "At-home movement and activewear finds that make it easier to get started.", imageUrl: "/creator-content/sophiee/pilates.jpg", displayOrder: 4 },
  { id: "initial-everyday", slug: "everyday", title: "Everyday", description: "Practical little finds that earn their place by making daily life simpler.", imageUrl: "/creator-content/sophiee/led-light.jpg", displayOrder: 5 },
] as const;

function collection(slug: (typeof categories)[number]["slug"]) {
  const category = categories.find((item) => item.slug === slug)!;
  return { slug: category.slug, title: category.title, imageUrl: category.imageUrl };
}

export const initialStories: readonly StorefrontStory[] = [
  { id: "initial-wig", slug: "the-easy-install-wig", title: "The easy-install wig", summary: "A closer look at the install, finish and everyday wearability before you decide.", altText: "Sophiee demonstrating an easy-install wig", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7685745781969554710", thumbnailUrl: "/creator-content/sophiee/wig.jpg", displayOrder: 1, collection: collection("beauty"), linkedProduct: null },
  { id: "initial-wall-panels", slug: "the-wall-panel-upgrade", title: "The wall-panel upgrade", summary: "A before-and-after home detail that changes the feel of a space without a full renovation.", altText: "Sophiee showing a wall-panel home decor upgrade", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7685517811254381846", thumbnailUrl: "/creator-content/sophiee/wall-panels.jpg", displayOrder: 2, collection: collection("home"), linkedProduct: null },
  { id: "initial-home-find", slug: "the-home-find", title: "The home find", summary: "A home-decor find shown in context, with the detail that made it worth saving.", altText: "Sophiee featuring a home decor find", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7683923192745905430", thumbnailUrl: "/creator-content/sophiee/home-decor.jpg", displayOrder: 3, collection: collection("home"), linkedProduct: null },
  { id: "initial-coat", slug: "the-autumn-coat", title: "The autumn coat", summary: "A warm layer with an easy silhouette—shown on camera so you can judge the shape for yourself.", altText: "Sophiee styling a winter coat", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7686222853515103510", thumbnailUrl: "/creator-content/sophiee/coat.jpg", displayOrder: 4, collection: collection("wear"), linkedProduct: null },
  { id: "initial-playsuit", slug: "the-easy-playsuit", title: "The easy playsuit", summary: "An outfit-in-motion look at fit, proportion and the details you cannot see in a flat lay.", altText: "Sophiee styling a playsuit", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7682083035663043862", thumbnailUrl: "/creator-content/sophiee/playsuit.jpg", displayOrder: 5, collection: collection("wear"), linkedProduct: null },
  { id: "initial-gym-set", slug: "the-gym-set", title: "The gym set", summary: "A coordinated activewear set seen in movement, not just posed in a product grid.", altText: "Sophiee wearing a coordinated gym set", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7682808145139453187", thumbnailUrl: "/creator-content/sophiee/gym-set.jpg", displayOrder: 6, collection: collection("move"), linkedProduct: null },
  { id: "initial-pilates-board", slug: "the-pilates-board", title: "The Pilates board", summary: "A home-workout setup shown from the first move, so you can see how it fits into real life.", altText: "Sophiee using a Pilates board at home", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7691411847072845078", thumbnailUrl: "/creator-content/sophiee/pilates.jpg", displayOrder: 7, collection: collection("move"), linkedProduct: null },
  { id: "initial-lipstick", slug: "the-transfer-proof-lip", title: "The transfer-proof lip", summary: "A beauty test focused on finish and staying power, with the original result right beside it.", altText: "Sophiee showing a transfer-proof lipstick look", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7669527376505703702", thumbnailUrl: "/creator-content/sophiee/wig.jpg", displayOrder: 8, collection: collection("beauty"), linkedProduct: null },
  { id: "initial-led-light", slug: "the-creator-light", title: "The creator light", summary: "A practical lighting essential for filming, getting ready or making a corner feel brighter.", altText: "Sophiee featuring an LED light for content creation", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7688835207943720214", thumbnailUrl: "/creator-content/sophiee/led-light.jpg", displayOrder: 9, collection: collection("everyday"), linkedProduct: null },
  { id: "initial-led-strips", slug: "the-soft-light-upgrade", title: "The soft-light upgrade", summary: "A simple lighting update for adding warmth and atmosphere to a room.", altText: "Sophiee showing LED strip lighting in a room", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7687741997943213334", thumbnailUrl: "/creator-content/sophiee/led-strips.jpg", displayOrder: 10, collection: collection("everyday"), linkedProduct: null },
  { id: "initial-shapewear", slug: "the-smooth-layer", title: "The smooth layer", summary: "A shapewear look at how the layer sits, moves and works under everyday outfits.", altText: "Sophiee reviewing a shapewear look", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7691605860899917078", thumbnailUrl: "/creator-content/sophiee/playsuit.jpg", displayOrder: 11, collection: collection("wear"), linkedProduct: null },
  { id: "initial-panels", slug: "the-hallway-refresh", title: "The hallway refresh", summary: "A practical decor idea for giving a hallway a more finished, layered feel.", altText: "Sophiee showing acoustic wall panels in a hallway", tiktokPostUrl: "https://www.tiktok.com/@sopheeeb/video/7683566384013462806", thumbnailUrl: "/creator-content/sophiee/wall-panels.jpg", displayOrder: 12, collection: collection("home"), linkedProduct: null },
];

export const initialStoryCategories: readonly StorefrontStoryCollection[] = categories.map((category) => ({
  ...category,
  storyCount: initialStories.filter((story) => story.collection.slug === category.slug).length,
  coverUrl: category.imageUrl,
  status: "published",
}));
