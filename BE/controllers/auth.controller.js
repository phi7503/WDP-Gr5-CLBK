import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/userModel.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();

//helpers
const issueAccess = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });

const setAccessCookie = (res, token) => {
  const prod = process.env.NODE_ENV === "production";
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? "none" : "lax",
    maxAge: 30 * 60 * 1000,
  });
};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: String(process.env.EMAIL_PORT) === "465", // true nếu 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      province,
      city,
      gender,
      dob,
      role = "customer",
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email đã tồn tại" });

    // Parse dob: chấp nhận "YYYY-MM-DD" hoặc "dd/mm/yyyy"
    let dobDate = null;
    if (dob) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        dobDate = new Date(dob);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
        const [d, m, y] = dob.split("/");
        dobDate = new Date(`${y}-${m}-${d}`);
      } else {
        return res.status(400).json({
          message: "Định dạng dob không hợp lệ (YYYY-MM-DD hoặc dd/mm/yyyy)",
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      province,
      city,
      gender,
      dob: dobDate,
      role,
    });

    const token = issueAccess(user._id);
    setAccessCookie(res, token);

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token,
    });
  } catch (e) {
    console.error("Register error:", e);
    if (e?.errors) {
      return res.status(400).json({
        message: Object.values(e.errors)
          .map((er) => er.message)
          .join(", "),
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(400).json({ message: "Tài khoản không tồn tại" });

    const ok = await user.matchPassword(password);
    if (!ok)
      return res.status(400).json({ message: "Email/Mật khẩu không đúng" });

    const token = issueAccess(user._id);
    await setAccessCookie(res, token);

    res.json({
      message: "Đăng nhập thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token,
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (_req, res) => {
  res.clearCookie("accessToken");
  res.json({ message: "Đã đăng xuất" });
};

export const me = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    // Trả đúng format user mà FE đang lưu
    const { _id, name, email, role, phone, city, province, gender, dob } =
      req.user;
    res.status(200).json({
      user: {
        _id,
        name,
        email,
        role,
        phone,
        city,
        province,
        gender,
        dob,
      },
    });
  } catch (err) {
    console.error("Error in /me:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(200)
        .json({ message: "Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn." });

    const resetToken = jwt.sign(
      { userId: user._id.toString(), purpose: "reset" },
      process.env.RESET_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const resetUrl = `${process.env.CLIENT_URL}reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Đặt lại mật khẩu - Cinema Tickets",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:540px;margin:auto">
          <h2 style="color:#d51b1b">Đặt lại mật khẩu</h2>
          <p>Xin chào ${user.name || ""},</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại CinemaTickets.</p>
          <p><a href="${resetUrl}" style="background:#d51b1b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Đặt lại mật khẩu</a></p>
          <p>Liên kết sẽ hết hạn trong <b>15 phút</b>. Nếu không phải bạn, vui lòng bỏ qua email này.</p>
        </div>
      `,
      text: `Nhấp vào link để đặt lại mật khẩu: ${resetUrl}`,
    });

    res.json({ message: "Đã gửi email đặt lại mật khẩu" });
  } catch (e) {
    console.error("Forgot error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.RESET_TOKEN_SECRET);
    } catch {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    if (payload.purpose !== "reset")
      return res.status(400).json({ message: "Token không hợp lệ" });

    const user = await User.findById(payload.userId).select("+password");
    if (!user) return res.status(400).json({ message: "Không tìm thấy user" });

    user.password = password;
    await user.save();
    const access = issueAccess(user._id);
    setAccessCookie(res, access);

    res.json({
      message: "Đặt lại mật khẩu thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("Reset error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

//Google Sign-In
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: false,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const emailObj = profile.emails?.[0];
        const email = emailObj?.value;
        const name =
          profile.displayName || (email ? email.split("@")[0] : "Google User");
        const sub = profile.id;

        if (!email) return done(new Error("Google account has no email"));

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name,
            email,
            password: `pg_${sub}_${Math.random().toString(36).slice(2)}`, // sẽ hash bởi pre-save
            phone: "N/A",
            province: "N/A",
            city: "N/A",
            gender: "other",
            dob: new Date("2000-01-01"),
            role: "customer",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
export default passport;
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });

    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        idToken
      )}`
    );
    if (!r.ok) return res.status(400).json({ message: "Invalid Google token" });
    const payload = await r.json();

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID)
      return res.status(400).json({ message: "aud mismatch" });

    const email = payload.email;
    const name = payload.name || email?.split("@")[0] || "Google User";

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: `g_${payload.sub}_${Math.random().toString(36).slice(2)}`,
        phone: "N/A",
        province: "N/A",
        city: "N/A",
        gender: "other",
        dob: new Date("2000-01-01"),
        role: "customer",
      });
    }

    const token = issueAccess(user._id);
    setAccessCookie(res, token);

    res.json({
      message: "Google login success",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token,
    });
  } catch (e) {
    console.error("Google login error:", e);
    res.status(500).json({ message: "Server error" });
  }
};
