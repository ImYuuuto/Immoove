import type { Listing } from '../types';

export const images = {
  hero: '/uploads/site/hero/coastal-hero.jpg',
  stay: '/uploads/site/categories/stays.jpg',
};

export const fallbackListings: Listing[] = [
  {
    title: 'La Maison Bleue',
    description: 'Villa lumineuse avec vue sur l’océan',
    basePrice: 1700,
    guestCapacity: 6,
    coverImageUrl: '/uploads/site/listings/maison-bleue.jpg',
  },
  {
    title: 'Dar El Bahri',
    description: 'Un refuge doux à quelques pas de la plage',
    basePrice: 1250,
    guestCapacity: 4,
    coverImageUrl: '/uploads/site/listings/dar-el-bahri.jpg',
  },
  {
    title: 'Villa des Dunes',
    description: 'L’adresse idéale pour les grandes tablées',
    basePrice: 2200,
    guestCapacity: 8,
    coverImageUrl: '/uploads/site/listings/villa-des-dunes.jpg',
  },
];
