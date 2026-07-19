import 'dotenv/config';
import { prisma } from '../src/utils/prisma.ts';

async function main() {
  const otp = await prisma.otp.findFirst({
    where: { mobileNumber: '5555555555' },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Latest OTP:', otp?.otpHash ? 'Has hash' : 'No hash');
  // Wait, let's see if the OTP is saved as raw or hashed.
  // In auth.controller.ts:
  // const otpHash = await bcrypt.hash(otp, 10);
  // It is saved as a hash!
  // Wait! If it's saved as a hash, how do we get the actual OTP value?
  // Let's check auth.controller.ts to see if it prints the OTP to the console, or does it save the plain OTP?
  // In index.ts or auth.controller.ts, let's search for otp hash and print statements.
}

main().catch(console.error);
