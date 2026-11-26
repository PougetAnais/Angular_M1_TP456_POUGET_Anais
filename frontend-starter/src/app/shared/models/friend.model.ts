import { AvatarId } from './user.model';

export type RelationshipState = 'none' | 'sent' | 'received' | 'friends';

export interface FriendUser {
  id: string;
  memberId: string;
  username: string;
  avatarId: AvatarId;
  visibility: 'public' | 'private';
  relationship?: RelationshipState;
  requestId?: string;
  createdAt?: string;
}

export interface FriendshipStatus {
  state: RelationshipState;
  requestId: string | null;
}
