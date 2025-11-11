import express from "express";
import passport, {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protectRoute,isAdmin,isEmployee } from "../middleware/auth.middleware.js";
import {
  issueAccess,
  setAccessCookie} from "../controllers/user.controller.js"
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, me);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


// B1: khởi động đăng nhập Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// B2: callback từ Google
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/google/failed", session: false }),
  async (req, res) => {
    const user = req.user;
    const token = issueAccess(user._id);
    setAccessCookie(res, token);
    const role = user.role;
    const client = process.env.CLIENT_URL || "http://localhost:5173";
    const target =
      role === "admin" ? "/admin" : role === "employee" ? "/staff" : "/";
    return res.redirect(`${client}${target}#token=${encodeURIComponent(token)}`);
  }
);

router.get("/google/failed", (_req, res) => {
  res.status(401).json({ message: "Google login failed" });
});

router.get("/admin/dashboard", protectRoute, isAdmin, (req, res) => {
  res.json({ msg: "Admin ok" });
});
router.get("/staff/overview", protectRoute, isEmployee, (req, res) => {
  res.json({ msg: "Employee ok" });
});
export default router;
