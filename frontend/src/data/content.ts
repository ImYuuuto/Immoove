import type { Listing, Post } from '../types';

export const images = {
  hero: '/uploads/site/hero/coastal-hero.jpg',
  stay: '/uploads/site/categories/stays.jpg',
  explore: '/uploads/site/categories/activities.jpg',
  food: '/uploads/site/categories/restaurants.jpg',
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

export const fallbackPosts: Post[] = [
  {
    title: '48 heures entre océan et médina',
    excerpt: 'Nos idées pour ralentir, explorer et savourer la côte.',
    category: 'IDÉES & INSPIRATION',
    cover_image_url: images.explore,
  },
  {
    title: 'Le rythme doux du Maroc',
    excerpt: 'Une invitation à prendre le temps de ne rien faire, vraiment.',
    category: 'BIEN-ÊTRE & ÉQUILIBRE',
    cover_image_url: '/uploads/site/categories/beach.jpg',
  },
  {
    title: 'Les saveurs de la côte',
    excerpt: 'À la rencontre des tables qui racontent notre région.',
    category: 'CARNET GOURMAND',
    cover_image_url: '/uploads/site/journal/coastal-flavours.jpg',
  },
];
