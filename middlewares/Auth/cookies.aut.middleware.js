import jwt from "jsonwebtoken";

const jwtCookieAuth = (req, res, next) => {
  // Read token from cookie instead of Authorization header
  const token = req.cookies?.token;

  console.log("==----0-0-", token);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    console.log("User authenticated successfully");

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: "Unauthorized Access" });
  }
};

export default jwtCookieAuth;
