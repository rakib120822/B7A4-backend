// console.log("seeding is done");
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";
import { Role } from "../generated/prisma/enums";
async function main() {
  //   console.log("running");
  const password = await bcrypt.hash("password123", 10);

  const [admin, technician, customer] = await Promise.all([
    prisma.user.create({
      data: {
        name: "sakib",
        email: "sakib@gmail.com",
        password,
        role: Role.ADMIN,
        profile: {
          create: {
            address: "Dhaka",
            phone: "012222222",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: "sakib",
        email: "akib@gmail.com",
        password,
        role: Role.TECHNICIAN,
        profile: {
          create: {
            address: "Dhaka",
            phone: "123235455",
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: "rakib",
        email: "rakib@gmail.com",
        password,
        profile: {
          create: {
            address: "Dhaka",
            phone: "123235455",
          },
        },
      },
    }),
  ]);
}

main().then(() => {
  process.exit(1);
});
