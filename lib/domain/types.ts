export type ProductStatus = "draft" | "published" | "archived";
export type OfferPlatform = "tiktok_shop" | "amazon";
export type SocialPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "pinterest"
  | "website"
  | "email";

export interface CreatorProfile {
  id: string;
  handle: string;
  displayName: string;
  tagline: string | null;
  profileImageUrl: string | null;
  affiliateDisclosure: string;
  contactEmail: string | null;
  contactVisible: boolean;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label: string | null;
  displayOrder: number;
  isVisible: boolean;
}

export interface Collection {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  status: ProductStatus;
}

export interface ProductOffer {
  id: string;
  platform: OfferPlatform;
  destinationUrl: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface ProductMedia {
  id: string;
  mediaType: "image" | "video" | "tiktok_embed";
  url: string;
  altText: string;
  displayOrder: number;
  isCover: boolean;
  tiktokPostUrl: string | null;
}

export interface CreatorVideo {
  id: string;
  creatorId: string;
  collectionId: string;
  linkedProductId: string | null;
  slug: string;
  title: string;
  summary: string;
  altText: string;
  tiktokPostUrl: string;
  thumbnailUrl: string;
  status: ProductStatus;
  displayOrder: number;
  publishedAt: string | null;
}

export interface PublicProduct {
  id: string;
  slug: string;
  title: string;
  creatorNote: string | null;
  tags: string[];
  collection: Pick<Collection, "title" | "slug"> | null;
  offer: Pick<ProductOffer, "id" | "platform"> | null;
  media: ProductMedia[];
}

export interface DashboardMetrics {
  publishedProducts: number;
  draftProducts: number;
  clicksLast30Days: number;
  topProducts: Array<{ title: string; clicks: number }>;
}
