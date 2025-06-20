import { NextResponse } from 'next/server';
import { UserDatabase } from '@/DatabaseLayer/user';
import { signUpSchema } from '../../../../../zod-validator';
import prisma from '@/DatabaseLayer';
import {
  generateAccessToken,
  generateHashPassword,
  generateRefreshToken,
} from '../../../../../utils/getHash';
import { randomBytes } from 'crypto';
import { setTokensAtTheTimeOfSignUp } from '@/helpers/cookies';

export async function POST(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded?.split(',')[0] || 'unknown';
  const signUpData = await request.json();
  const signUpDataValidation = signUpSchema.safeParse(signUpData);

  if (!signUpDataValidation.success) {
    return NextResponse.json({ error: signUpDataValidation.error.format() }, { status: 400 });
  }

  const { email, password } = signUpDataValidation.data;

  //check if user with this email already exist in database
  const userWithEmail = await UserDatabase.getUserByEmail(email);

  if (userWithEmail) {
    return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
  }

  const hashedPassword = await generateHashPassword(password);
  try {
    const newUser = await prisma.users.create({
      email: email,
      passwordHash: hashedPassword,
    });
    const response = NextResponse.json(
      {
        message: 'User Created Successfully',
        user: newUser,
      },
      { status: 201 }
    );

    const newUserProfile = await prisma.user_profiles.create({
      userId: newUser.id,
    });

    const ascessToken = generateAccessToken(newUser.id, email);
    const refreshToken = generateRefreshToken(randomBytes(64).toString('hex'));

    const setSessionDetails = await prisma.sessions.create({
      userId: newUser.id,
      refreshTokenHash: refreshToken,
      userAgent: userAgent,
      ipAddress: ipAddress,
    });

    setTokensAtTheTimeOfSignUp(ascessToken, refreshToken, response);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'An error occurred while creating the user profile',
        details: error,
      },
      { status: 500 }
    );
  }
}
