import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Password123!";

async function main() {
  console.log("Seeding database...");

  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.listingFeature.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.propertyDetail.deleteMany();
  await prisma.vehicleDetail.deleteMany();
  await prisma.serviceDetail.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const locations = await Promise.all([
    prisma.location.create({
      data: {
        cityName: "Sidi Bouzid",
        country: "Tunisia",
        latitude: new Prisma.Decimal("35.038200"),
        longitude: new Prisma.Decimal("9.484900"),
      },
    }),
    prisma.location.create({
      data: {
        cityName: "Regueb",
        country: "Tunisia",
        latitude: new Prisma.Decimal("34.859700"),
        longitude: new Prisma.Decimal("9.787500"),
      },
    }),
    prisma.location.create({
      data: {
        cityName: "Meknassy",
        country: "Tunisia",
        latitude: new Prisma.Decimal("34.601400"),
        longitude: new Prisma.Decimal("9.608300"),
      },
    }),
    prisma.location.create({
      data: {
        cityName: "Sfax",
        country: "Tunisia",
        latitude: new Prisma.Decimal("34.740600"),
        longitude: new Prisma.Decimal("10.760300"),
      },
    }),
  ]);

  const [sidiBouzid, regueb, meknassy, sfax] = locations;

  const accommodation = await prisma.serviceCategory.create({
    data: {
      name: "Hébergement",
      slug: "accommodation",
      description: "Maisons d'hôtes, appartements et villas à louer",
    },
  });

  const carRental = await prisma.serviceCategory.create({
    data: {
      name: "Location de voiture",
      slug: "car-rental",
      description: "Véhicules disponibles à la journée ou à la semaine",
    },
  });

  const localServices = await prisma.serviceCategory.create({
    data: {
      name: "Services locaux",
      slug: "local-services",
      description: "Guides, coiffure, photographie et autres prestations",
    },
  });

  const accommodationFeatures = await Promise.all([
    prisma.feature.create({ data: { categoryId: accommodation.categoryId, name: "Wi-Fi" } }),
    prisma.feature.create({ data: { categoryId: accommodation.categoryId, name: "Climatisation" } }),
    prisma.feature.create({ data: { categoryId: accommodation.categoryId, name: "Parking" } }),
    prisma.feature.create({ data: { categoryId: accommodation.categoryId, name: "Cuisine équipée" } }),
  ]);

  const carFeatures = await Promise.all([
    prisma.feature.create({ data: { categoryId: carRental.categoryId, name: "GPS" } }),
    prisma.feature.create({ data: { categoryId: carRental.categoryId, name: "Assurance incluse" } }),
    prisma.feature.create({ data: { categoryId: carRental.categoryId, name: "Siège bébé" } }),
  ]);

  const serviceFeatures = await Promise.all([
    prisma.feature.create({ data: { categoryId: localServices.categoryId, name: "Déplacement inclus" } }),
    prisma.feature.create({ data: { categoryId: localServices.categoryId, name: "Matériel fourni" } }),
  ]);

  const admin = await prisma.user.create({
    data: {
      firstName: "Amine",
      lastName: "Trabelsi",
      email: "admin@sidi-bouzid.tn",
      passwordHash,
      phone: "+216 71 000 001",
      role: "admin",
    },
  });

  const providers = await Promise.all([
    prisma.user.create({
      data: {
        firstName: "Fatma",
        lastName: "Gharbi",
        email: "fatma.gharbi@example.tn",
        passwordHash,
        phone: "+216 76 123 456",
        role: "provider",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Mohamed",
        lastName: "Jebali",
        email: "mohamed.jebali@example.tn",
        passwordHash,
        phone: "+216 98 234 567",
        role: "provider",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Salma",
        lastName: "Ben Ayed",
        email: "salma.benayed@example.tn",
        passwordHash,
        phone: "+216 22 345 678",
        role: "provider",
      },
    }),
  ]);

  const clients = await Promise.all([
    prisma.user.create({
      data: {
        firstName: "Youssef",
        lastName: "Mansouri",
        email: "youssef.mansouri@example.tn",
        passwordHash,
        phone: "+216 55 111 222",
        role: "client",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Ines",
        lastName: "Khelifi",
        email: "ines.khelifi@example.tn",
        passwordHash,
        phone: "+216 27 333 444",
        role: "client",
      },
    }),
  ]);

  const [fatma, mohamed, salma] = providers;
  const [youssef, ines] = clients;

  const maisonTraditionnelle = await prisma.listing.create({
    data: {
      providerId: fatma.userId,
      categoryId: accommodation.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Maison traditionnelle au cœur de Sidi Bouzid",
      description:
        "Charmante maison de ville rénovée avec patio intérieur, idéale pour découvrir la région. Proche des souks et des sites historiques.",
      basePrice: new Prisma.Decimal("85.00"),
      pricingUnit: "per_night",
      propertyDetails: {
        create: {
          propertyType: "house",
          bedrooms: 3,
          bathrooms: 2,
          maxGuests: 6,
          streetAddress: "12 Rue Habib Bourguiba, Sidi Bouzid",
        },
      },
      features: {
        create: [
          { featureId: accommodationFeatures[0].featureId },
          { featureId: accommodationFeatures[1].featureId },
          { featureId: accommodationFeatures[2].featureId },
        ],
      },
    },
  });

  const appartementRegueb = await prisma.listing.create({
    data: {
      providerId: fatma.userId,
      categoryId: accommodation.categoryId,
      locationId: regueb.locationId,
      title: "Appartement meublé à Regueb",
      description: "Studio moderne et lumineux, parfait pour un séjour professionnel ou touristique.",
      basePrice: new Prisma.Decimal("55.00"),
      pricingUnit: "per_night",
      propertyDetails: {
        create: {
          propertyType: "apartment",
          bedrooms: 1,
          bathrooms: 1,
          maxGuests: 2,
          streetAddress: "5 Avenue de l'Indépendance, Regueb",
        },
      },
      features: {
        create: [
          { featureId: accommodationFeatures[0].featureId },
          { featureId: accommodationFeatures[3].featureId },
        ],
      },
    },
  });

  const villaMeknassy = await prisma.listing.create({
    data: {
      providerId: mohamed.userId,
      categoryId: accommodation.categoryId,
      locationId: meknassy.locationId,
      title: "Villa avec jardin à Meknassy",
      description: "Grande villa familiale avec jardin ombragé et terrasse. Calme et spacieux.",
      basePrice: new Prisma.Decimal("120.00"),
      pricingUnit: "per_night",
      propertyDetails: {
        create: {
          propertyType: "villa",
          bedrooms: 4,
          bathrooms: 3,
          maxGuests: 8,
          streetAddress: "Route de Sfax km 2, Meknassy",
        },
      },
      features: {
        create: [
          { featureId: accommodationFeatures[1].featureId },
          { featureId: accommodationFeatures[2].featureId },
        ],
      },
    },
  });

  const renaultClio = await prisma.listing.create({
    data: {
      providerId: mohamed.userId,
      categoryId: carRental.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Renault Clio 2022 — économique",
      description: "Citadine fiable, faible consommation. Idéale pour la ville et les alentours.",
      basePrice: new Prisma.Decimal("45.00"),
      pricingUnit: "per_day",
      vehicleDetails: {
        create: {
          make: "Renault",
          model: "Clio",
          year: 2022,
          transmission: "manual",
          fuelType: "gasoline",
          seats: 5,
        },
      },
      features: {
        create: [
          { featureId: carFeatures[0].featureId },
          { featureId: carFeatures[1].featureId },
        ],
      },
    },
  });

  const peugeot208 = await prisma.listing.create({
    data: {
      providerId: salma.userId,
      categoryId: carRental.categoryId,
      locationId: sfax.locationId,
      title: "Peugeot 208 2021 — automatique",
      description: "Conduite confortable, livraison possible à Sidi Bouzid sur demande.",
      basePrice: new Prisma.Decimal("60.00"),
      pricingUnit: "per_day",
      vehicleDetails: {
        create: {
          make: "Peugeot",
          model: "208",
          year: 2021,
          transmission: "automatic",
          fuelType: "diesel",
          seats: 5,
        },
      },
      features: {
        create: [
          { featureId: carFeatures[1].featureId },
          { featureId: carFeatures[2].featureId },
        ],
      },
    },
  });

  const guideTour = await prisma.listing.create({
    data: {
      providerId: salma.userId,
      categoryId: localServices.categoryId,
      locationId: sidiBouzid.locationId,
      title: "Guide touristique — région de Sidi Bouzid",
      description:
        "Visite des sites historiques, marchés locaux et paysages steppiques. Français et arabe.",
      basePrice: new Prisma.Decimal("35.00"),
      pricingUnit: "per_hour",
      serviceDetails: {
        create: {
          durationMinutes: 120,
          isAtHome: false,
          shopAddress: "Place Mohamed Ali, Sidi Bouzid",
        },
      },
      features: {
        create: [{ featureId: serviceFeatures[0].featureId }],
      },
    },
  });

  const coiffeurDomicile = await prisma.listing.create({
    data: {
      providerId: fatma.userId,
      categoryId: localServices.categoryId,
      locationId: regueb.locationId,
      title: "Coiffure à domicile",
      description: "Coupe, brushing et soins capillaires. Déplacement dans un rayon de 15 km.",
      basePrice: new Prisma.Decimal("25.00"),
      pricingUnit: "per_service",
      serviceDetails: {
        create: {
          durationMinutes: 90,
          isAtHome: true,
        },
      },
      features: {
        create: [{ featureId: serviceFeatures[1].featureId }],
      },
    },
  });

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.availabilitySlot.createMany({
    data: [
      {
        listingId: maisonTraditionnelle.listingId,
        startTime: addDays(1),
        endTime: addDays(8),
        isBooked: false,
      },
      {
        listingId: appartementRegueb.listingId,
        startTime: addDays(2),
        endTime: addDays(5),
        isBooked: false,
      },
      {
        listingId: renaultClio.listingId,
        startTime: addDays(1),
        endTime: addDays(4),
        isBooked: false,
      },
      {
        listingId: guideTour.listingId,
        startTime: addDays(3),
        endTime: addDays(3),
        isBooked: false,
      },
    ],
  });

  const completedBooking = await prisma.booking.create({
    data: {
      clientId: youssef.userId,
      listingId: maisonTraditionnelle.listingId,
      startDatetime: addDays(-14),
      endDatetime: addDays(-11),
      totalPrice: new Prisma.Decimal("255.00"),
      status: "completed",
      payment: {
        create: {
          amount: new Prisma.Decimal("255.00"),
          commissionFee: new Prisma.Decimal("25.50"),
          paymentMethod: "card",
          paymentStatus: "paid",
        },
      },
      review: {
        create: {
          rating: 5,
          comment: "Excellent accueil, maison très propre et bien située. Je recommande !",
        },
      },
    },
  });

  await prisma.booking.create({
    data: {
      clientId: ines.userId,
      listingId: renaultClio.listingId,
      startDatetime: addDays(5),
      endDatetime: addDays(8),
      totalPrice: new Prisma.Decimal("135.00"),
      status: "confirmed",
      payment: {
        create: {
          amount: new Prisma.Decimal("135.00"),
          commissionFee: new Prisma.Decimal("13.50"),
          paymentMethod: "card",
          paymentStatus: "paid",
        },
      },
    },
  });

  await prisma.booking.create({
    data: {
      clientId: youssef.userId,
      listingId: guideTour.listingId,
      startDatetime: addDays(10),
      endDatetime: addDays(10),
      totalPrice: new Prisma.Decimal("70.00"),
      status: "pending",
    },
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Demo login (all accounts):");
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Admin:    ${admin.email}`);
  console.log(`  Provider: ${fatma.email}, ${mohamed.email}, ${salma.email}`);
  console.log(`  Client:   ${youssef.email}, ${ines.email}`);
  console.log("");
  console.log(`Listings: 8 | Bookings: 3 (1 completed with review)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
