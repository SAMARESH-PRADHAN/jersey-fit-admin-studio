import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { adminUsers } from "../db/schema/auth.js";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "jersey-fit-backend-secret-minimum-32-chars-long!",
);

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  static checkRateLimit(email: string): boolean {
    const now = Date.now();
    const record = loginAttempts.get(email.toLowerCase());
    if (!record) return true;
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(email.toLowerCase());
      return true;
    }
    return record.count < MAX_ATTEMPTS;
  }

  static recordFailedAttempt(email: string): void {
    const key = email.toLowerCase();
    const now = Date.now();
    const record = loginAttempts.get(key);
    if (!record || now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.set(key, { count: 1, firstAttempt: now });
    } else {
      record.count += 1;
    }
  }

  static clearAttempts(email: string): void {
    loginAttempts.delete(email.toLowerCase());
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static async createToken(payload: { userId: string; email: string; role: string; name: string }): Promise<string> {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);
  }

  static async verifyToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as { userId: string; email: string; role: "admin" | "staff"; name: string };
    } catch {
      return null;
    }
  }

  static async login(email: string, password: string) {
    const key = email.trim().toLowerCase();
    if (!this.checkRateLimit(key)) {
      throw new Error("Too many failed login attempts. Please try again after 15 minutes.");
    }

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, key))
      .limit(1);

    if (!user || !user.active) {
      this.recordFailedAttempt(key);
      throw new Error("Invalid email or password");
    }

    const match = await this.verifyPassword(password, user.passwordHash);
    if (!match) {
      this.recordFailedAttempt(key);
      throw new Error("Invalid email or password");
    }

    this.clearAttempts(key);
    const token = await this.createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }
}
