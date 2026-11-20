export type AvatarId =
  | 'person-man-light' | 'person-man-medium' | 'person-man-dark'
  | 'person-woman-light' | 'person-woman-medium' | 'person-woman-dark'
  | 'fruit-apple' | 'fruit-orange' | 'fruit-strawberry' | 'fruit-watermelon'
  | 'fruit-pineapple' | 'fruit-grapes' | 'fruit-peach'
  | 'animal-cat' | 'animal-dog' | 'animal-fox' | 'animal-rabbit'
  | 'animal-bear' | 'animal-panda' | 'animal-penguin';

/** Données publiques d'un compte renvoyées par l'API. */
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  visibility: 'public' | 'private';
  avatarId: AvatarId;
  createdAt: string;
}
