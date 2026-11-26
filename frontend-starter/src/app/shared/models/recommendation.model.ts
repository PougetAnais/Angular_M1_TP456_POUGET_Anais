import { AvatarId } from './user.model';

export interface Recommendation {
  id: string;
  animeTitle: string;
  rating: number;
  comment: string;
  seasonOrVolume: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatarId: AvatarId;
  };
  isOwner: boolean;
}

export interface RecommendationDraft {
  animeTitle: string;
  rating: number;
  comment: string;
  seasonOrVolume: string;
  image: File | null;
  removeImage?: boolean;
}
