import { Role } from "@prisma/client";
import { getPagination, buildMeta } from "../../shared/pagination";
import { logAudit } from "../../shared/auditLog";
import { AdminRepository } from "./admin.repository";
import { cacheDel, cacheGetOrSet, CacheKeys, CACHE_TTL } from "../../lib/cache";
import { blockIp, unblockIp, listBlockedIps } from "../../lib/ipBlocklist";

const listUsers = async (query: { page?: string; limit?: string; role?: Role }) => {
  const { page, limit, skip } = getPagination(query);
  const [users, total] = await AdminRepository.findUsers({ skip, take: limit, role: query.role });
  return { users, meta: buildMeta(page, limit, total) };
};

const changeUserRole = async (adminId: string, userId: string, role: Role) => {
  const user = await AdminRepository.updateRole(userId, role);
  await cacheDel(CacheKeys.adminStats, CacheKeys.membership(userId));
  logAudit({ actorId: adminId, action: "user.role_changed", entityType: "User", entityId: userId, metadata: { role } });
  return user;
};

const dashboardStats = () =>
  cacheGetOrSet(CacheKeys.adminStats, CACHE_TTL.adminStats, () => AdminRepository.dashboardStats());

const listAuditLogs = async (query: { page?: string; limit?: string }) => {
  const { page, limit, skip } = getPagination(query);
  const [logs, total] = await AdminRepository.findAuditLogs({ skip, take: limit });
  return { logs, meta: buildMeta(page, limit, total) };
};

const blockIpAddress = async (adminId: string, ip: string, ttlHours?: number) => {
  const ttlSeconds = ttlHours ? ttlHours * 60 * 60 : undefined;
  await blockIp(ip, ttlSeconds);
  logAudit({ actorId: adminId, action: "ip.blocked", entityType: "IpBlock", entityId: ip, metadata: { ttlHours: ttlHours ?? "permanent" } });
  return { ip, ttlHours: ttlHours ?? null, blocked: true };
};

const unblockIpAddress = async (adminId: string, ip: string) => {
  await unblockIp(ip);
  logAudit({ actorId: adminId, action: "ip.unblocked", entityType: "IpBlock", entityId: ip });
  return { ip, blocked: false };
};

const listBlockedIpAddresses = () => listBlockedIps();

export const AdminService = {
  listUsers,
  changeUserRole,
  dashboardStats,
  listAuditLogs,
  blockIpAddress,
  unblockIpAddress,
  listBlockedIpAddresses,
};
