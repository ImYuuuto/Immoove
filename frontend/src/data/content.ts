import type { Listing, Post } from '../types';

export const images = {
  hero: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=88',
  stay: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85',
  explore: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85',
  food: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85',
};

export const fallbackListings: Listing[] = [
  { title: 'La Maison Bleue', description: 'Villa lumineuse avec vue sur l’océan', basePrice: 1700, guestCapacity: 6, coverImageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85' },
  { title: 'Dar El Bahri', description: 'Un refuge doux à quelques pas de la plage', basePrice: 1250, guestCapacity: 4, coverImageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85' },
  { title: 'Villa des Dunes', description: 'L’adresse idéale pour les grandes tablées', basePrice: 2200, guestCapacity: 8, coverImageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85' },
];

export const fallbackPosts: Post[] = [
  { title: '48 heures entre océan et médina', excerpt: 'Nos idées pour ralentir, explorer et savourer la côte.', category: 'IDÉES & INSPIRATION', cover_image_url: images.explore },
  { title: 'Le rythme doux de Sidi Bouzid', excerpt: 'Une invitation à prendre le temps de ne rien faire, vraiment.', category: 'BIEN-ÊTRE & ÉQUILIBRE', cover_image_url: 'https://images.unsplash.com/photo-1507520084875-3f0baf6f9d23?auto=format&fit=crop&w=900&q=85' },
  { title: 'Les saveurs de la côte', excerpt: 'À la rencontre des tables qui racontent notre région.', category: 'CARNET GOURMAND', cover_image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85' },
];
