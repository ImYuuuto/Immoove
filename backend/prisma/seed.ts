import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Password123!";

async function main() {
  console.log("Seeding database...");

  await prisma.auditLog.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.listingFeature.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.propertyDetail.deleteMany();
  await prisma.vehicleDetail.deleteMany();
  await prisma.serviceDetail.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [sidiBouzid, elJadida, azemmour, oualidia] = await Promise.all([
    prisma.location.create({
      data: {
        cityName: "Sidi Bouzid",
        country: "Maroc",
        latitude: new Prisma.Decimal("33.226100"),
        longitude: new Prisma.Decimal("-8.555800"),
      },
    }),
    prisma.location.create({
      data: {
        cityName: "El Jadida",
        country: "Maroc",
        latitude: new Prisma.Decimal("33.231600"),
        longitude: new Prisma.Decimal("-8.500700"),
      },
    }),
    prisma.location.create({
      data: {
        cityName: "Azemmour",
        country: "Maroc",
        latitude: new Prisma.Decimal("33.289500"),
        longitude: new Prisma.Decimal("-8.342500"),
      },
    }),
    prisma.location.create({
      data: {
        cityName: "Oualidia",
        country: "Maroc",
        latitude: new Prisma.Decimal("32.733300"),
        longitude: new Prisma.Decimal("-9.033300"),
      },
    }),
  ]);

  const stays = await prisma.serviceCategory.create({
    data: {
      name: "Séjours courts",
      slug: "short-stays",
      description: "Maisons, riads et appartements à la nuitée",
    },
  });
  const restaurants = await prisma.serviceCategory.create({
    data: {
      name: "Restaurants & cafés",
      slug: "restaurants",
      description: "Tables en bord de mer, cafés et adresses locales",
    },
  });
  const activities = await prisma.serviceCategory.create({
    data: {
      name: "Activités & loisirs",
      slug: "activities",
      description: "Surf, balades, sorties en mer et expériences locales",
    },
  });
  const homes = await prisma.serviceCategory.create({
    data: {
      name: "Maisons & appartements",
      slug: "homes",
      description: "Biens à vendre à Sidi Bouzid et alentours",
    },
  });
  const cars = await prisma.serviceCategory.create({
    data: {
      name: "Location de voitures",
      slug: "car-rental",
      description: "Véhicules pour explorer la côte atlantique",
    },
  });
  const vacations = await prisma.serviceCategory.create({
    data: {
      name: "Lieux de vacances",
      slug: "vacations",
      description: "Villas et villégiatures pour des séjours d'exception",
    },
  });

  const stayFeatures = await Promise.all([
    prisma.feature.create({ data: { categoryId: stays.categoryId, name: "Wi-Fi" } }),
    prisma.feature.create({ data: { categoryId: stays.categoryId, name: "Climatisation" } }),
    prisma.feature.create({ data: { categoryId: stays.categoryId, name: "Vue mer" } }),
    prisma.feature.create({ data: { categoryId: stays.categoryId, name: "Terrasse" } }),
  ]);
  const carFeatures = await Promise.all([
    prisma.feature.create({ data: { categoryId: cars.categoryId, name: "GPS" } }),
    prisma.feature.create({ data: { categoryId: cars.categoryId, name: "Assurance incluse" } }),
  ]);

  const admin = await prisma.user.create({
    data: {
      firstName: "Amine",
      lastName: "El Idrissi",
      email: "admin@sidi-bouzid.ma",
      passwordHash,
      phone: "+212661000001",
      role: "admin",
    },
  });

  const moderator = await prisma.user.create({
    data: {
      firstName: "Leila",
      lastName: "Bennani",
      email: "modo@sidi-bouzid.ma",
      passwordHash,
      phone: "+212661000002",
      role: "moderator",
    },
  });

  const [fatma, mohamed, salma] = await Promise.all([
    prisma.user.create({
      data: {
        firstName: "Fatma",
        lastName: "Gharbi",
        email: "fatma.gharbi@example.ma",
        passwordHash,
        phone: "+212661123456",
        role: "provider",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Mohamed",
        lastName: "Jebali",
        email: "mohamed.jebali@example.ma",
        passwordHash,
        phone: "+212662234567",
        role: "provider",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Salma",
        lastName: "Ben Ayed",
        email: "salma.benayed@example.ma",
        passwordHash,
        phone: "+212663345678",
        role: "provider",
      },
    }),
  ]);

  const [youssef, ines] = await Promise.all([
    prisma.user.create({
      data: {
        firstName: "Youssef",
        lastName: "Mansouri",
        email: "youssef.mansouri@example.ma",
        passwordHash,
        phone: "+212664111222",
        role: "client",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Ines",
        lastName: "Khelifi",
        email: "ines.khelifi@example.ma",
        passwordHash,
        phone: "+212665333444",
        role: "client",
      },
    }),
  ]);

  const villaMer = await prisma.listing.create({
    data: {
      providerId: fatma.userId,
      categoryId: vacations.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Villa Horizon — pieds dans le sable",
      description:
        "Villa contemporaine face à l'Atlantique, terrasses ouvertes et lumière du soir. Idéale pour une parenthèse d'été à Sidi Bouzid.",
      basePrice: new Prisma.Decimal("1850.00"),
      pricingUnit: "per_night",
      status: "approved",
      isActive: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80",
      contactName: "Fatma Gharbi",
      contactPhone: "+212661123456",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80", sortOrder: 0 },
          { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80", sortOrder: 1 },
          { url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80", sortOrder: 2 },
        ],
      },
      propertyDetails: {
        create: {
          propertyType: "villa",
          bedrooms: 4,
          bathrooms: 3,
          maxGuests: 8,
          streetAddress: "Corniche de Sidi Bouzid, El Jadida",
        },
      },
      features: {
        create: stayFeatures.map((f) => ({ featureId: f.featureId })),
      },
    },
  });

  const riad = await prisma.listing.create({
    data: {
      providerId: fatma.userId,
      categoryId: stays.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Riad des Alizés",
      description: "Patio ombragé, chambres blanches et petit-déjeuner maison. Un séjour Airbnb-style à deux pas de la plage.",
      basePrice: new Prisma.Decimal("780.00"),
      pricingUnit: "per_night",
      status: "approved",
      isActive: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80", sortOrder: 0 },
          { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80", sortOrder: 1 },
        ],
      },
      propertyDetails: {
        create: {
          propertyType: "riad",
          bedrooms: 3,
          bathrooms: 2,
          maxGuests: 6,
          streetAddress: "12 Rue des Pêcheurs, Sidi Bouzid",
        },
      },
      features: {
        create: [
          { featureId: stayFeatures[0].featureId },
          { featureId: stayFeatures[3].featureId },
        ],
      },
    },
  });

  const cafe = await prisma.listing.create({
    data: {
      providerId: mohamed.userId,
      categoryId: restaurants.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Café Marée Haute",
      description: "Café-restaurant face aux vagues, poissons grillés et pâtisseries du matin. Réservation conseillée le week-end.",
      basePrice: new Prisma.Decimal("220.00"),
      pricingUnit: "per_service",
      status: "approved",
      isActive: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80", sortOrder: 0 },
          { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80", sortOrder: 1 },
        ],
      },
    },
  });

  const surf = await prisma.listing.create({
    data: {
      providerId: salma.userId,
      categoryId: activities.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Session surf & yoga au lever du soleil",
      description: "Cours de surf adaptés à tous les niveaux, puis yoga sur la dune. Planche et combinaison fournies.",
      basePrice: new Prisma.Decimal("350.00"),
      pricingUnit: "per_hour",
      status: "approved",
      isActive: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1502680390469-be75680c3bfb?auto=format&fit=crop&w=1400&q=80",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1502680390469-be75680c3bfb?auto=format&fit=crop&w=1400&q=80", sortOrder: 0 },
        ],
      },
      serviceDetails: {
        create: { durationMinutes: 120, isAtHome: false, shopAddress: "Plage de Sidi Bouzid" },
      },
    },
  });

  const apartmentSale = await prisma.listing.create({
    data: {
      providerId: mohamed.userId,
      categoryId: homes.categoryId,
      locationId: elJadida.locationId,
      title: "Appartement lumineux près de la corniche",
      description: "3 pièces, balcon mer, résidence calme. Idéal résidence secondaire ou investissement.",
      basePrice: new Prisma.Decimal("980000.00"),
      pricingUnit: "per_service",
      status: "approved",
      isActive: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80", sortOrder: 0 },
        ],
      },
      propertyDetails: {
        create: {
          propertyType: "apartment",
          bedrooms: 2,
          bathrooms: 1,
          maxGuests: 4,
          streetAddress: "Résidence Atlantique, El Jadida",
        },
      },
    },
  });

  const clio = await prisma.listing.create({
    data: {
      providerId: mohamed.userId,
      categoryId: cars.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Renault Clio 2023 — bord de mer",
      description: "Citadine récente, livraison possible à El Jadida ou Sidi Bouzid.",
      basePrice: new Prisma.Decimal("350.00"),
      pricingUnit: "per_day",
      status: "approved",
      isActive: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=80",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=80", sortOrder: 0 },
        ],
      },
      vehicleDetails: {
        create: {
          make: "Renault",
          model: "Clio",
          year: 2023,
          transmission: "automatic",
          fuelType: "gasoline",
          seats: 5,
        },
      },
      features: {
        create: carFeatures.map((f) => ({ featureId: f.featureId })),
      },
    },
  });

  await prisma.listing.create({
    data: {
      providerId: salma.userId,
      categoryId: restaurants.categoryId,
      locationId: oualidia.locationId,
      title: "Table d'hôtes huîtres & lagune",
      description: "Proposition en attente de validation — dégustation d'huîtres à Oualidia.",
      basePrice: new Prisma.Decimal("280.00"),
      pricingUnit: "per_service",
      status: "pending",
      isActive: false,
      coverImageUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80",
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80", sortOrder: 0 },
        ],
      },
    },
  });

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.availabilitySlot.createMany({
    data: [
      { listingId: villaMer.listingId, startTime: addDays(1), endTime: addDays(30), isBooked: false },
      { listingId: riad.listingId, startTime: addDays(2), endTime: addDays(20), isBooked: false },
      { listingId: clio.listingId, startTime: addDays(1), endTime: addDays(14), isBooked: false },
    ],
  });

  await prisma.booking.create({
    data: {
      clientId: youssef.userId,
      listingId: villaMer.listingId,
      startDatetime: addDays(-14),
      endDatetime: addDays(-11),
      totalPrice: new Prisma.Decimal("5550.00"),
      status: "completed",
      guestName: "Youssef Mansouri",
      guestPhone: "+212664111222",
      guestCount: 4,
      payment: {
        create: {
          amount: new Prisma.Decimal("5550.00"),
          commissionFee: new Prisma.Decimal("555.00"),
          paymentMethod: "card",
          paymentStatus: "paid",
        },
      },
      review: {
        create: {
          rating: 5,
          comment: "Lumière, silence, océan. Un séjour inoubliable.",
        },
      },
    },
  });

  await prisma.booking.create({
    data: {
      clientId: ines.userId,
      listingId: clio.listingId,
      startDatetime: addDays(5),
      endDatetime: addDays(8),
      totalPrice: new Prisma.Decimal("1050.00"),
      status: "confirmed",
      guestName: "Ines Khelifi",
      guestPhone: "+212665333444",
      guestCount: 2,
    },
  });

  await prisma.booking.create({
    data: {
      clientId: youssef.userId,
      listingId: surf.listingId,
      startDatetime: addDays(10),
      endDatetime: addDays(10),
      totalPrice: new Prisma.Decimal("350.00"),
      status: "pending",
      guestName: "Youssef Mansouri",
      guestPhone: "+212664111222",
      guestCount: 2,
      message: "Première session, niveau débutant.",
    },
  });

  await prisma.savedListing.create({
    data: { userId: youssef.userId, listingId: riad.listingId },
  });

  await prisma.contactMessage.create({
    data: {
      userId: youssef.userId,
      listingId: cafe.listingId,
      name: "Youssef Mansouri",
      email: youssef.email,
      phone: youssef.phone,
      subject: "Table pour 4",
      body: "Bonjour, avez-vous une table terrasse samedi soir ?",
      isRead: false,
    },
  });

  console.log("Seed complete.");
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Admin:      ${admin.email}`);
  console.log(`  Moderator:  ${moderator.email}`);
  console.log(`  Client:     ${youssef.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
