

import doubleCircle from './assets/icons/double_circle.svg';
import circle from './assets/icons/circle.svg';
import triangle from './assets/icons/triangle.svg'; 
export function affinityIcon(score: number) {
    if (score >= 151) return doubleCircle;
    if (score >= 51) return circle;
return triangle;
}

const characterImages = import.meta.glob(
'/src/assets/character_sprites/*.png',
{ eager: true, import: 'default' }
);

import characters from "./data/characters.json";
import type { CharacterOption } from './components/CharacterPickerSingle.svelte';
export const baseOptions: CharacterOption[] = characters
    .filter((c: any) => c.released === 1)
    .map((c: any) => {
    const imagePath = `/src/assets/character_sprites/${c.name}.png`;

    return {
        id: c.id,
        name: c.name,
        image: characterImages[imagePath] as string
    };
    });

export function preloadImages() {
    for (const option of baseOptions) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = option.image;
      document.head.appendChild(link);
    }

    console.log("Prefetch links added");
}

export const idToOption = new Map(baseOptions.map(o => [o.id, o]));
