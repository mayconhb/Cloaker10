import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const ADMIN_USER = {
  id: "admin-user-id",
  email: "admin@123.com",
  password: "admin123",
  firstName: "Admin",
  lastName: "User",
  profileImageUrl: null,
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-linkshield",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  await storage.upsertUser({
    id: ADMIN_USER.id,
    email: ADMIN_USER.email,
    firstName: ADMIN_USER.firstName,
    lastName: ADMIN_USER.lastName,
    profileImageUrl: ADMIN_USER.profileImageUrl,
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
      (req.session as any).userId = ADMIN_USER.id;
      (req.session as any).user = {
        id: ADMIN_USER.id,
        email: ADMIN_USER.email,
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
      };
      return res.json({ success: true, message: "Login realizado com sucesso" });
    }

    return res.status(401).json({ success: false, message: "Email ou senha inválidos" });
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  (req as any).user = { claims: { sub: userId } };
  return next();
};
