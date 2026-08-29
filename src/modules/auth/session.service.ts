import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { errors } from '../../shared/errors';

const REFRESH_TOKEN_BYTES = 32;

export interface IssuedRefreshToken {
  refreshToken: string;
  expiresAt: Date;
}

export interface RotatedRefreshToken extends IssuedRefreshToken {
  userId: string;
}

/** 256 bits de entropía: el token no lo elige nadie, se sortea. */
export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

/**
 * Solo se almacena el hash. A diferencia de una contraseña, aquí SHA-256 basta
 * y es lo indicado: el valor es aleatorio y de entropía completa, así que no hay
 * nada que un ataque de diccionario pueda adivinar, y la búsqueda por índice
 * único sigue siendo directa.
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueRefreshToken(
  prisma: PrismaClient,
  userId: string,
  ttlSeconds: number,
  familyId: string = randomUUID(),
): Promise<IssuedRefreshToken> {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefreshToken(refreshToken), familyId, expiresAt },
  });

  return { refreshToken, expiresAt };
}

/**
 * Rota el token: el presentado se revoca y se emite uno nuevo en la misma
 * familia. Si llega un token que ya estaba revocado, se asume que alguien copió
 * la credencial y se revoca la cadena entera, no solo ese token.
 */
export async function rotateRefreshToken(
  prisma: PrismaClient,
  presentedToken: string,
  ttlSeconds: number,
): Promise<RotatedRefreshToken> {
  const tokenHash = hashRefreshToken(presentedToken);

  type Outcome =
    | { status: 'rejected' }
    | { status: 'reused'; familyId: string }
    | ({ status: 'rotated' } & RotatedRefreshToken);

  const outcome = await prisma.$transaction(async (transaction): Promise<Outcome> => {
    const stored = await transaction.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { isActive: true } } },
    });

    if (!stored) {
      return { status: 'rejected' };
    }

    if (stored.revokedAt !== null) {
      return { status: 'reused', familyId: stored.familyId };
    }

    const now = new Date();
    if (stored.expiresAt <= now || !stored.user.isActive) {
      return { status: 'rejected' };
    }

    await transaction.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: now },
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    await transaction.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashRefreshToken(refreshToken),
        familyId: stored.familyId,
        expiresAt,
      },
    });

    return { status: 'rotated', userId: stored.userId, refreshToken, expiresAt };
  });

  if (outcome.status === 'reused') {
    // La revocación de la familia va fuera de la transacción a propósito: si se
    // hiciera dentro y después se lanzara el error, el rollback desharía
    // exactamente la revocación que se pretende aplicar.
    await prisma.refreshToken.updateMany({
      where: { familyId: outcome.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw errors.invalidRefreshToken();
  }

  if (outcome.status === 'rejected') {
    throw errors.invalidRefreshToken();
  }

  return {
    userId: outcome.userId,
    refreshToken: outcome.refreshToken,
    expiresAt: outcome.expiresAt,
  };
}

/**
 * Cierre de sesión. Es idempotente a propósito: un token desconocido no
 * distingue su respuesta de uno válido, para no convertir el cierre de sesión
 * en un oráculo que confirme si una credencial existe.
 */
export async function revokeRefreshToken(
  prisma: PrismaClient,
  presentedToken: string,
): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(presentedToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Cierra todas las sesiones de la cuenta, en todos los dispositivos. */
export async function revokeAllUserSessions(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Limpieza oportunista de tokens caducados. Se invoca al iniciar sesión para
 * que la tabla no crezca sin límite sin necesidad de un proceso programado.
 */
export async function purgeExpiredRefreshTokens(prisma: PrismaClient): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
