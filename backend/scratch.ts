import prisma from './src/utils/prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'guest@hotel.com' } });
  console.log('User found:', user);
  if (user) {
    const isValid = await bcrypt.compare('password123', user.password);
    console.log('Password valid:', isValid);
  }
}
main().catch(console.error);
