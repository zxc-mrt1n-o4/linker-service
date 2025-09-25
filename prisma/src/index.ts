import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  const newUser = await prisma.user.create({
    data: {
      username: 'Percy Prisma',
      email: 'percy@example.com',
      password: 'password',
    },
  });
  console.log('The new user:', newUser);

  const users = await prisma.user.findMany();
  console.log('All users:', users);

  // See more examples of how to use Prisma ORM: https://www.prisma.io/docs/getting-started/quickstart
}

main();
