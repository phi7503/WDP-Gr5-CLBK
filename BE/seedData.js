import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userModel.js";
import Movie from "./models/movieModel.js";
import Branch from "./models/branchModel.js";
import Theater from "./models/theaterModel.js";
import Showtime from "./models/showtimeModel.js";
import Booking from "./models/bookingModel.js";
import Combo from "./models/comboModel.js";
import Voucher from "./models/voucherModel.js";

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Branch.deleteMany({});
    await Theater.deleteMany({});
    await Showtime.deleteMany({});
    await Booking.deleteMany({});
    await Combo.deleteMany({});
    await Voucher.deleteMany({});

    // Create users
    const admin = await User.create({
      name: "Admin User",
      email: "admin@cinema.com",
      password: "123456",
      phone: "0123456789",
      province: "Hồ Chí Minh",
      city: "Quận 1",
      gender: "male",
      dob: new Date("1990-01-01"),
      role: "admin"
    });

    const employee = await User.create({
      name: "Employee User",
      email: "employee@cinema.com",
      password: "123456",
      phone: "0987654321",
      province: "Hồ Chí Minh",
      city: "Quận 1",
      gender: "female",
      dob: new Date("1995-05-15"),
      role: "employee"
    });

    const customer = await User.create({
      name: "Customer User",
      email: "customer@cinema.com",
      password: "123456",
      phone: "0123456789",
      province: "Hồ Chí Minh",
      city: "Quận 1",
      gender: "male",
      dob: new Date("1992-03-20"),
      role: "customer"
    });

    // Create movies
    const movie1 = await Movie.create({
      title: "Avengers: Endgame",
      description: "The epic conclusion to the Infinity Saga",
      duration: 181,
      genre: ["Action", "Adventure", "Drama"],
      director: "Anthony Russo, Joe Russo",
      cast: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo"],
      releaseDate: new Date("2019-04-26"),
      poster: "https://via.placeholder.com/300x450",
      trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
      rating: 8.4,
      isActive: true
    });

    const movie2 = await Movie.create({
      title: "Spider-Man: No Way Home",
      description: "Peter Parker's identity is revealed to the world",
      duration: 148,
      genre: ["Action", "Adventure", "Sci-Fi"],
      director: "Jon Watts",
      cast: ["Tom Holland", "Zendaya", "Benedict Cumberbatch"],
      releaseDate: new Date("2021-12-17"),
      poster: "https://via.placeholder.com/300x450",
      trailer: "https://www.youtube.com/watch?v=JfVOs4VSpmA",
      rating: 8.2,
      isActive: true
    });

    // Create branches
    const branch1 = await Branch.create({
      name: "CGV Vincom Center",
      location: "70-72 Lê Thánh Tôn, Quận 1, TP.HCM",
      phone: "1900 6017",
      isActive: true
    });

    const branch2 = await Branch.create({
      name: "CGV Crescent Mall",
      location: "101 Tôn Dật Tiên, Quận 7, TP.HCM",
      phone: "1900 6017",
      isActive: true
    });

    // Create theaters
    const theater1 = await Theater.create({
      name: "Cinema 1",
      capacity: 200,
      branch: branch1._id,
      isActive: true
    });

    const theater2 = await Theater.create({
      name: "Cinema 2",
      capacity: 150,
      branch: branch1._id,
      isActive: true
    });

    // Create showtimes
    const showtime1 = await Showtime.create({
      movie: movie1._id,
      theater: theater1._id,
      branch: branch1._id,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      price: 120000,
      isActive: true
    });

    const showtime2 = await Showtime.create({
      movie: movie2._id,
      theater: theater2._id,
      branch: branch1._id,
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      endTime: new Date(Date.now() + 6.5 * 60 * 60 * 1000), // 6.5 hours from now
      price: 100000,
      isActive: true
    });

    // Create combos
    const combo1 = await Combo.create({
      name: "Combo Popcorn + Coke",
      description: "1 bắp ngô lớn + 1 nước ngọt lớn",
      price: 50000,
      items: ["Popcorn Large", "Coke Large"],
      isActive: true
    });

    const combo2 = await Combo.create({
      name: "Combo Family",
      description: "2 bắp ngô + 2 nước ngọt + 1 hotdog",
      price: 120000,
      items: ["Popcorn x2", "Coke x2", "Hotdog"],
      isActive: true
    });

    // Create vouchers
    const voucher1 = await Voucher.create({
      code: "WELCOME10",
      name: "Chào mừng khách hàng mới",
      description: "Giảm 10% cho đơn hàng đầu tiên",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 100000,
      maxDiscount: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true
    });

    // Create sample bookings
    const booking1 = await Booking.create({
      user: customer._id,
      employeeId: employee._id,
      showtime: showtime1._id,
      seats: [
        { row: "A", number: 1, type: "standard", price: 120000 },
        { row: "A", number: 2, type: "standard", price: 120000 }
      ],
      totalAmount: 240000,
      combos: [
        { combo: combo1._id, quantity: 1, price: 50000 }
      ],
      paymentStatus: "completed",
      bookingStatus: "confirmed",
      customerInfo: {
        name: "Nguyễn Văn A",
        email: "nguyenvana@email.com",
        phone: "0123456789"
      }
    });

    const booking2 = await Booking.create({
      user: customer._id,
      employeeId: employee._id,
      showtime: showtime2._id,
      seats: [
        { row: "B", number: 5, type: "vip", price: 150000 }
      ],
      totalAmount: 150000,
      paymentStatus: "pending",
      bookingStatus: "pending",
      customerInfo: {
        name: "Trần Thị B",
        email: "tranthib@email.com",
        phone: "0987654321"
      }
    });

    console.log("Data seeded successfully!");
    console.log("Admin:", admin.email);
    console.log("Employee:", employee.email);
    console.log("Customer:", customer.email);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
