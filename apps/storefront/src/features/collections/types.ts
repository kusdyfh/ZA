export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  isCurrentlyLive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
}
