import { AvatarId } from './models/user.model';

export const AVATAR_DEFAULT: AvatarId = 'animal-cat';
export const avatarChoices: { id: AvatarId; label: string; category: string }[] = [
  { id: 'person-woman-light', label: 'Femme · peau claire', category: 'Personnes' },
  { id: 'person-woman-medium', label: 'Femme · peau mate', category: 'Personnes' },
  { id: 'person-woman-dark', label: 'Femme · peau foncée', category: 'Personnes' },
  { id: 'person-man-light', label: 'Homme · peau claire', category: 'Personnes' },
  { id: 'person-man-medium', label: 'Homme · peau mate', category: 'Personnes' },
  { id: 'person-man-dark', label: 'Homme · peau foncée', category: 'Personnes' },
  { id: 'fruit-apple', label: 'Pomme', category: 'Fruits' },
  { id: 'fruit-orange', label: 'Orange', category: 'Fruits' },
  { id: 'fruit-strawberry', label: 'Fraise', category: 'Fruits' },
  { id: 'fruit-watermelon', label: 'Pastèque', category: 'Fruits' },
  { id: 'fruit-pineapple', label: 'Ananas', category: 'Fruits' },
  { id: 'fruit-grapes', label: 'Raisin', category: 'Fruits' },
  { id: 'fruit-peach', label: 'Pêche', category: 'Fruits' },
  { id: 'animal-cat', label: 'Chat', category: 'Animaux' },
  { id: 'animal-dog', label: 'Chien', category: 'Animaux' },
  { id: 'animal-fox', label: 'Renard', category: 'Animaux' },
  { id: 'animal-rabbit', label: 'Lapin', category: 'Animaux' },
  { id: 'animal-bear', label: 'Ours', category: 'Animaux' },
  { id: 'animal-panda', label: 'Panda', category: 'Animaux' },
  { id: 'animal-penguin', label: 'Pingouin', category: 'Animaux' },
];

export function avatarPresetUrl(id: AvatarId): string {
  // The icon symbols live inline in the app shell so they work reliably in
  // previews and controls without loading an external SVG fragment.
  return `#${id}`;
}
