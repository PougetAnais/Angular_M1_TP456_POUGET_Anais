import { AvatarId } from './user.model';

export interface UserProfile {
  id: string;
  memberId: string;
  username: string;
  visibility: 'public' | 'private';
  avatarId: AvatarId;
  createdAt: string;
  email?: string;
  isOwner: boolean;
}
