import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";
import { Role, BookingStatus, PaymentStatus } from "../generated/prisma/enums";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Delete existing data in the right order (reverse of creation order)
    await prisma.payment.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.availability.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.technicianProfile.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.category.deleteMany({});
    console.log("✅ Cleared existing data");

    // Hash password
    const password = await bcrypt.hash("password123", 10);

    // ============= CREATE USERS =============
    console.log("📝 Creating users...");
    const [admin, technician, customer, customer2] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Sakib Ahmed",
          email: "sakib@gmail.com",
          password,
          role: Role.ADMIN,
          profile: {
            create: {
              address: "Dhaka, Bangladesh",
              phone: "01200000001",
              image: "https://example.com/admin.jpg",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          name: "Ahmad Khan",
          email: "ahmad@gmail.com",
          password,
          role: Role.TECHNICIAN,
          profile: {
            create: {
              address: "Dhaka, Bangladesh",
              phone: "01700000001",
              image: "https://example.com/tech1.jpg",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          name: "Rahul Roy",
          email: "rahul@gmail.com",
          password,
          role: Role.CUSTOMER,
          profile: {
            create: {
              address: "Dhaka, Bangladesh",
              phone: "01600000001",
              image: "https://example.com/customer1.jpg",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          name: "Priya Sharma",
          email: "priya@gmail.com",
          password,
          role: Role.CUSTOMER,
          profile: {
            create: {
              address: "Chittagong, Bangladesh",
              phone: "01500000001",
              image: "https://example.com/customer2.jpg",
            },
          },
        },
      }),
    ]);
    console.log("✅ Users created");

    // ============= CREATE TECHNICIAN PROFILE =============
    console.log("📝 Creating technician profile...");
    const technicianProfile = await prisma.technicianProfile.create({
      data: {
        userId: technician.id,
        experience: 5,
        rating: 4,
        serviceArea: ["Dhaka", "Gulshan", "Banani"],
      },
    });
    console.log("✅ Technician profile created");

    // ============= CREATE CATEGORIES =============
    console.log("📝 Creating categories...");
    const [category1, category2, category3] = await Promise.all([
      prisma.category.create({
        data: {
          name: "Plumbing",
          description: "All plumbing related services",
          isActive: true,
        },
      }),
      prisma.category.create({
        data: {
          name: "Electrical",
          description: "Electrical installation and repair services",
          isActive: true,
        },
      }),
      prisma.category.create({
        data: {
          name: "Carpentry",
          description: "Carpentry and wood work services",
          isActive: true,
        },
      }),
    ]);
    console.log("✅ Categories created");

    // ============= CREATE SERVICES =============
    console.log("📝 Creating services...");
    const [service1, service2, service3] = await Promise.all([
      prisma.service.create({
        data: {
          serviceName: "Pipe Installation",
          description: "Professional pipe installation service",
          pricePerHour: 500,
          isActive: true,
          serviceArea: ["Dhaka", "Gulshan"],
          technicianId: technicianProfile.id,
          categoryId: category1.id,
        },
      }),
      prisma.service.create({
        data: {
          serviceName: "Electrical Wiring",
          description: "Complete electrical wiring and installation",
          pricePerHour: 600,
          isActive: true,
          serviceArea: ["Dhaka", "Banani"],
          technicianId: technicianProfile.id,
          categoryId: category2.id,
        },
      }),
      prisma.service.create({
        data: {
          serviceName: "Furniture Assembly",
          description: "Professional furniture assembly service",
          pricePerHour: 400,
          isActive: true,
          serviceArea: ["Dhaka"],
          technicianId: technicianProfile.id,
          categoryId: category3.id,
        },
      }),
    ]);
    console.log("✅ Services created");

    // ============= CREATE AVAILABILITY =============
    console.log("📝 Creating availability slots...");
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextDay = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    await Promise.all([
      prisma.availability.create({
        data: {
          availableDate: tomorrow,
          startTime: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000),
          endTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000),
          isBooked: false,
        },
      }),
      prisma.availability.create({
        data: {
          availableDate: tomorrow,
          startTime: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000),
          endTime: new Date(tomorrow.getTime() + 17 * 60 * 60 * 1000),
          isBooked: false,
        },
      }),
      prisma.availability.create({
        data: {
          availableDate: nextDay,
          startTime: new Date(nextDay.getTime() + 10 * 60 * 60 * 1000),
          endTime: new Date(nextDay.getTime() + 13 * 60 * 60 * 1000),
          isBooked: false,
        },
      }),
    ]);
    console.log("✅ Availability slots created");

    // ============= CREATE BOOKINGS =============
    console.log("📝 Creating bookings...");
    const booking1StartDate = new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000);
    const booking1EndDate = new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000);
    const booking2StartDate = new Date(nextDay.getTime() + 10 * 60 * 60 * 1000);
    const booking2EndDate = new Date(nextDay.getTime() + 13 * 60 * 60 * 1000);

    const [booking1, booking2] = await Promise.all([
      prisma.booking.create({
        data: {
          userId: customer.id,
          serviceId: service1.id,
          status: BookingStatus.PAID,
          startDate: booking1StartDate,
          endDate: booking1EndDate,
          price: 1500,
        },
      }),
      prisma.booking.create({
        data: {
          userId: customer2.id,
          serviceId: service2.id,
          status: BookingStatus.PENDING,
          startDate: booking2StartDate,
          endDate: booking2EndDate,
          price: 1800,
        },
      }),
    ]);
    console.log("✅ Bookings created");

    // ============= CREATE PAYMENTS =============
    console.log("📝 Creating payments...");
    await Promise.all([
      prisma.payment.create({
        data: {
          userId: customer.id,
          bookingId: booking1.id,
          amount: 150000, // in cents (1500 in dollars)
          currency: "usd",
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: "pi_1234567890abcdef",
          stripeSessionId: "cs_test_1234567890abcdef",
        },
      }),
      prisma.payment.create({
        data: {
          userId: customer2.id,
          bookingId: booking2.id,
          amount: 180000, // in cents (1800 in dollars)
          currency: "usd",
          status: PaymentStatus.PENDING,
          stripePaymentIntentId: "pi_0987654321fedcba",
        },
      }),
    ]);
    console.log("✅ Payments created");

    // ============= CREATE REVIEWS =============
    console.log("📝 Creating reviews...");
    await prisma.review.create({
      data: {
        customerId: customer.id,
        technicianId: technicianProfile.id,
        comment: "Excellent service! Very professional and on time. Highly recommended!",
      },
    });
    console.log("✅ Reviews created");

    console.log("✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🔌 Prisma disconnected");
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("🔴 Fatal error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
