import jwt from "jsonwebtoken";

const PLATFORM_SECRET = process.env.PLATFORM_JWT_SECRET;

// Verifies a platform-admin (Super Admin) token. Uses PLATFORM_JWT_SECRET —
// a completely different secret than studio user tokens — so this will
// reject any studio-user token outright, and studio routes' `authenticate`
// (which uses JWT_SECRET) will likewise reject any platform token. This is
// the enforcement point for "Super Admin cannot access studio internal data":
// none of the studio data controllers/routes ever import or accept this
// middleware, and platform admin routes never touch client/booking/gallery/
// invoice/etc. tables.
export const authenticatePlatform = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, PLATFORM_SECRET);
        if (decoded.scope !== "platform") {
            return res.status(403).json({ message: "Invalid token scope." });
        }
        req.platformAdmin = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ message: "Invalid token." });
    }
};
