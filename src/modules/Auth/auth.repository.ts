import prisma from "../../shared/prisma";
import { Role, AuthProvider } from "@prisma/client";

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;

const findByEmail = (email: string) =>
  prisma.user.findFirst({ where: { email, deletedAt: null } });

const findById = (id: string) =>
  prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: USER_PUBLIC_SELECT,
  });

const findByGoogleId = (googleId: string) =>
  prisma.user.findFirst({ where: { googleId, deletedAt: null } });

const create = (data: {
  name: string;
  email: string;
  passwordHash?: string;
  provider: AuthProvider;
  googleId?: string;
  role: Role;
}) => prisma.user.create({ data, select: USER_PUBLIC_SELECT });

const update = (id: string, data: { name?: string; avatarUrl?: string }) =>
  prisma.user.update({ where: { id }, data, select: USER_PUBLIC_SELECT });

export const AuthRepository = {
  findByEmail,
  findById,
  findByGoogleId,
  create,
  update,
};
