import User from "../models/userModel.js";
import jwt from "jsonwebtoken";


export const issueAccess = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });
export const setAccessCookie = (res, token) => {
  const prod = process.env.NODE_ENV === "production";
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? "none" : "lax",
    path: "/",
    maxAge: 30 * 60 * 1000,
  });
};


export const updateMe = async (req, res) => {
  try {
    const { name, email, phone } = req.body; // FE gửi 3 field này
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    // Nếu cho phép đổi email thì check trùng
    if (email && email !== user.email) {
      const exist = await User.findOne({ email });
      if (exist) return res.status(400).json({ message: "Email đã được sử dụng" });
      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    const { _id, role } = user;
    res.json({
      message: "Cập nhật thành công",
      user: { _id, name: user.name, email: user.email, phone: user.phone, role },
    });
  } catch (e) {
    console.error("updateMe error:", e);
    res.status(500).json({ message: "Server error" });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log(req.user)
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    user.password = newPassword; 
    await user.save();


    const token = issueAccess(user._id);
    setAccessCookie(res, token);

    res.json({ message: "Đổi mật khẩu thành công", token });
  } catch (e) {
    console.error("changePassword error:", e.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email phone role createdAt")
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (e) {
    console.error("Get users error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Lấy 1 user theo id (nếu bạn vẫn cần)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email phone role createdAt"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (e) {
    console.error("Get user by id error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Tạo user mới (match popup: fullName, email, phone, password, role)
// Các field required khác set default
export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role = "customer" } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      // các field required khác – cho default giống chỗ google login
      gender: "other",
      dob: new Date("2000-01-01"),
      province: "N/A",
      city: "N/A",
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error("Create user error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Cập nhật user (match popup: fullName, email, phone, role, optional password)
export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check email trùng
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (password) user.password = password; // pre-save hook sẽ hash

    const updated = await user.save();

    return res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      createdAt: updated.createdAt,
    });
  } catch (e) {
    console.error("Update user error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Xoá user (cho luôn vì FE đang có popup delete)
export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    return res.json({ message: "Đã xóa người dùng" });
  } catch (e) {
    console.error("Delete user error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};