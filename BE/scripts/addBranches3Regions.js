import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from '../models/branchModel.js';
import Theater from '../models/theaterModel.js';
import SeatLayout from '../models/seatLayoutModel.js';
import Seat from '../models/seatModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Dữ liệu rạp cho 3 miền Bắc, Trung, Nam
const branchesData = [
  // ========== MIỀN BẮC ==========
  // Hà Nội - CGV
  { 
    name: 'CGV Vincom Center Ba Đình', 
    chain: 'CGV', 
    city: 'Hà Nội', 
    province: 'Hà Nội',
    address: 'Tầng 4, Vincom Center Ba Đình, 191 Bà Triệu, Phường Lê Đại Hành, Quận Hai Bà Trưng',
    phone: '024 3974 3333',
    coordinates: { latitude: 21.0145, longitude: 105.8522 },
    facilities: ['IMAX', '3D', '4DX', 'Parking', 'Café', 'VIP']
  },
  { 
    name: 'CGV Vincom Royal City', 
    chain: 'CGV', 
    city: 'Hà Nội', 
    province: 'Hà Nội',
    address: 'Tầng B1, Vincom Royal City, 72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân',
    phone: '024 3555 8888',
    coordinates: { latitude: 21.0000, longitude: 105.8167 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP', 'Dolby Atmos']
  },
  { 
    name: 'CGV Aeon Mall Long Biên', 
    chain: 'CGV', 
    city: 'Hà Nội', 
    province: 'Hà Nội',
    address: 'Tầng 3, Aeon Mall Long Biên, 27 Cổ Linh, Phường Long Biên, Quận Long Biên',
    phone: '024 3873 9999',
    coordinates: { latitude: 21.0408, longitude: 105.8889 },
    facilities: ['3D', 'Parking', 'Café', 'VIP']
  },
  { 
    name: 'CGV Landmark 72', 
    chain: 'CGV', 
    city: 'Hà Nội', 
    province: 'Hà Nội',
    address: 'Tầng 4, Landmark 72, Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm',
    phone: '024 3775 5555',
    coordinates: { latitude: 21.0145, longitude: 105.7833 },
    facilities: ['IMAX', '3D', '4DX', 'Parking', 'Café', 'VIP', 'Dolby Atmos']
  },
  
  // Hà Nội - BHD
  { 
    name: 'BHD Star Cineplex Vincom Nguyễn Chí Thanh', 
    chain: 'BHD', 
    city: 'Hà Nội', 
    province: 'Hà Nội',
    address: 'Tầng 4, Vincom Nguyễn Chí Thanh, 54A Nguyễn Chí Thanh, Phường Láng Thượng, Quận Đống Đa',
    phone: '024 3773 3333',
    coordinates: { latitude: 21.0278, longitude: 105.8014 },
    facilities: ['3D', 'Parking', 'Café', 'VIP']
  },
  { 
    name: 'BHD Star Cineplex Vincom Times City', 
    chain: 'BHD', 
    city: 'Hà Nội', 
    province: 'Hà Nội',
    address: 'Tầng 4, Vincom Times City, 458 Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng',
    phone: '024 3974 6666',
    coordinates: { latitude: 20.9981, longitude: 105.8708 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  
  // Hà Nội - Lotte
  { 
    name: 'Lotte Cinema Hà Nội', 
    chain: 'Lotte', 
    city: 'Hà Nội', 
    province: 'Hà Nội',
    address: 'Tầng 4, Lotte Center Hà Nội, 54 Liễu Giai, Phường Cống Vị, Quận Ba Đình',
    phone: '024 3775 7777',
    coordinates: { latitude: 21.0306, longitude: 105.8083 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP', 'Dolby Atmos']
  },
  
  // Hải Phòng
  { 
    name: 'CGV Vincom Hải Phòng', 
    chain: 'CGV', 
    city: 'Hải Phòng', 
    province: 'Hải Phòng',
    address: 'Tầng 4, Vincom Hải Phòng, 4 Lạch Tray, Phường Máy Chai, Quận Ngô Quyền',
    phone: '0225 3737 888',
    coordinates: { latitude: 20.8449, longitude: 106.6881 },
    facilities: ['3D', 'Parking', 'Café', 'VIP']
  },
  
  // Quảng Ninh
  { 
    name: 'CGV Hạ Long', 
    chain: 'CGV', 
    city: 'Hạ Long', 
    province: 'Quảng Ninh',
    address: 'Tầng 3, Vincom Hạ Long, 10A Lê Thánh Tôn, Phường Bạch Đằng, Thành phố Hạ Long',
    phone: '0203 3515 888',
    coordinates: { latitude: 20.9101, longitude: 107.0759 },
    facilities: ['3D', 'Parking', 'Café']
  },
  
  // ========== MIỀN TRUNG ==========
  // Đà Nẵng - CGV
  { 
    name: 'CGV Vincom Đà Nẵng', 
    chain: 'CGV', 
    city: 'Đà Nẵng', 
    province: 'Đà Nẵng',
    address: 'Tầng 4, Vincom Đà Nẵng, 910A Ngô Quyền, Phường An Hải Bắc, Quận Sơn Trà',
    phone: '0236 3535 888',
    coordinates: { latitude: 16.0544, longitude: 108.2472 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  { 
    name: 'CGV Lotte Mart Đà Nẵng', 
    chain: 'CGV', 
    city: 'Đà Nẵng', 
    province: 'Đà Nẵng',
    address: 'Tầng 3, Lotte Mart Đà Nẵng, 255-257 Hùng Vương, Phường Vĩnh Trung, Quận Thanh Khê',
    phone: '0236 3655 999',
    coordinates: { latitude: 16.0680, longitude: 108.2128 },
    facilities: ['3D', 'Parking', 'Café']
  },
  
  // Đà Nẵng - BHD
  { 
    name: 'BHD Star Cineplex Đà Nẵng', 
    chain: 'BHD', 
    city: 'Đà Nẵng', 
    province: 'Đà Nẵng',
    address: 'Tầng 4, BigC Đà Nẵng, 255-257 Hùng Vương, Phường Vĩnh Trung, Quận Thanh Khê',
    phone: '0236 3777 333',
    coordinates: { latitude: 16.0680, longitude: 108.2128 },
    facilities: ['3D', 'Parking', 'Café', 'VIP']
  },
  
  // Huế
  { 
    name: 'CGV Vincom Huế', 
    chain: 'CGV', 
    city: 'Huế', 
    province: 'Thừa Thiên Huế',
    address: 'Tầng 3, Vincom Huế, 50A Hùng Vương, Phường Phú Hội, Thành phố Huế',
    phone: '0234 3939 888',
    coordinates: { latitude: 16.4637, longitude: 107.5909 },
    facilities: ['3D', 'Parking', 'Café']
  },
  
  // Nha Trang
  { 
    name: 'CGV Nha Trang Center', 
    chain: 'CGV', 
    city: 'Nha Trang', 
    province: 'Khánh Hòa',
    address: 'Tầng 4, Nha Trang Center, 20 Trần Phú, Phường Lộc Thọ, Thành phố Nha Trang',
    phone: '0258 3525 888',
    coordinates: { latitude: 12.2388, longitude: 109.1967 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  
  // Quy Nhơn
  { 
    name: 'CGV Quy Nhơn', 
    chain: 'CGV', 
    city: 'Quy Nhơn', 
    province: 'Bình Định',
    address: 'Tầng 3, Vincom Quy Nhơn, 01 Nguyễn Tất Thành, Phường Lê Hồng Phong, Thành phố Quy Nhơn',
    phone: '0256 3535 999',
    coordinates: { latitude: 13.7765, longitude: 109.2233 },
    facilities: ['3D', 'Parking', 'Café']
  },
  
  // ========== MIỀN NAM ==========
  // TP.HCM - CGV (thêm)
  { 
    name: 'CGV Crescent Mall', 
    chain: 'CGV', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 3, Crescent Mall, 101 Tôn Dật Tiên, Phường Tân Phú, Quận 7',
    phone: '028 5412 3333',
    coordinates: { latitude: 10.7297, longitude: 106.7158 },
    facilities: ['IMAX', '3D', '4DX', 'Parking', 'Café', 'VIP', 'Dolby Atmos']
  },
  { 
    name: 'CGV Pandora City', 
    chain: 'CGV', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 4, Pandora City, 1/1 Trường Chinh, Phường Tân Thới Nhất, Quận 12',
    phone: '028 6255 8888',
    coordinates: { latitude: 10.8700, longitude: 106.6250 },
    facilities: ['3D', 'Parking', 'Café', 'VIP']
  },
  { 
    name: 'CGV Estella Place', 
    chain: 'CGV', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 3, Estella Place, 88 Song Hành, Phường An Phú, Quận 2',
    phone: '028 3744 9999',
    coordinates: { latitude: 10.7870, longitude: 106.7510 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  { 
    name: 'CGV SC VivoCity', 
    chain: 'CGV', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 4, SC VivoCity, 1058 Nguyễn Văn Linh, Phường Tân Phong, Quận 7',
    phone: '028 5412 6666',
    coordinates: { latitude: 10.7297, longitude: 106.7158 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  
  // TP.HCM - BHD (thêm)
  { 
    name: 'BHD Star Cineplex Vincom Đồng Khởi', 
    chain: 'BHD', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 4, Vincom Đồng Khởi, 72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1',
    phone: '028 3822 3333',
    coordinates: { latitude: 10.7769, longitude: 106.7009 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  { 
    name: 'BHD Star Cineplex Vincom Thủ Đức', 
    chain: 'BHD', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 4, Vincom Thủ Đức, 216 Võ Văn Ngân, Phường Bình Thọ, Thành phố Thủ Đức',
    phone: '028 3725 8888',
    coordinates: { latitude: 10.8500, longitude: 106.7500 },
    facilities: ['3D', 'Parking', 'Café', 'VIP']
  },
  
  // TP.HCM - Lotte (thêm)
  { 
    name: 'Lotte Cinema Nam Sài Gòn', 
    chain: 'Lotte', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 3, Lotte Mart Nam Sài Gòn, 469 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7',
    phone: '028 3775 7777',
    coordinates: { latitude: 10.7297, longitude: 106.7158 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  
  // Cần Thơ
  { 
    name: 'CGV Vincom Cần Thơ', 
    chain: 'CGV', 
    city: 'Cần Thơ', 
    province: 'Cần Thơ',
    address: 'Tầng 3, Vincom Cần Thơ, 209 Đường 30/4, Phường Xuân Khánh, Quận Ninh Kiều',
    phone: '0292 3737 888',
    coordinates: { latitude: 10.0452, longitude: 105.7469 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  
  // An Giang
  { 
    name: 'CGV Long Xuyên', 
    chain: 'CGV', 
    city: 'Long Xuyên', 
    province: 'An Giang',
    address: 'Tầng 3, BigC Long Xuyên, 01 Trần Hưng Đạo, Phường Mỹ Bình, Thành phố Long Xuyên',
    phone: '0296 3535 999',
    coordinates: { latitude: 10.3800, longitude: 105.4300 },
    facilities: ['3D', 'Parking', 'Café']
  },
  
  // Đồng Nai
  { 
    name: 'CGV Biên Hòa', 
    chain: 'CGV', 
    city: 'Biên Hòa', 
    province: 'Đồng Nai',
    address: 'Tầng 3, BigC Biên Hòa, 1096 Phạm Văn Thuận, Phường Tân Mai, Thành phố Biên Hòa',
    phone: '0251 3838 888',
    coordinates: { latitude: 10.9500, longitude: 106.8200 },
    facilities: ['3D', 'Parking', 'Café', 'VIP']
  },
  
  // Bình Dương
  { 
    name: 'CGV Aeon Bình Dương', 
    chain: 'CGV', 
    city: 'Thủ Dầu Một', 
    province: 'Bình Dương',
    address: 'Tầng 3, Aeon Mall Bình Dương, 1 Đại Lộ Bình Dương, Phường Chánh Nghĩa, Thành phố Thủ Dầu Một',
    phone: '0274 3535 888',
    coordinates: { latitude: 10.9800, longitude: 106.6500 },
    facilities: ['IMAX', '3D', 'Parking', 'Café', 'VIP']
  },
  
  // Vũng Tàu
  { 
    name: 'CGV Vũng Tàu', 
    chain: 'CGV', 
    city: 'Vũng Tàu', 
    province: 'Bà Rịa - Vũng Tàu',
    address: 'Tầng 3, Lotte Mart Vũng Tàu, 18 Trần Phú, Phường 1, Thành phố Vũng Tàu',
    phone: '0254 3535 999',
    coordinates: { latitude: 10.3460, longitude: 107.0843 },
    facilities: ['3D', 'Parking', 'Café']
  },
  
  // Galaxy Cinema
  { 
    name: 'Galaxy Cinema Quận 1', 
    chain: 'Galaxy', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 3, 116 Nguyễn Du, Phường Bến Thành, Quận 1',
    phone: '028 3822 4444',
    coordinates: { latitude: 10.7769, longitude: 106.7009 },
    facilities: ['3D', 'Parking', 'Café']
  },
  
  // Beta Cinema
  { 
    name: 'Beta Cinema Cineplex', 
    chain: 'Beta', 
    city: 'Ho Chi Minh', 
    province: 'Ho Chi Minh',
    address: 'Tầng 4, 123 Lý Tự Trọng, Phường Bến Thành, Quận 1',
    phone: '028 3822 5555',
    coordinates: { latitude: 10.7769, longitude: 106.7009 },
    facilities: ['3D', 'Parking']
  },
];

const createBranches = async () => {
  console.log('🎬 Creating Branches for 3 Regions (Bắc, Trung, Nam)...\n');
  
  let createdCount = 0;
  let skippedCount = 0;

  for (const branchData of branchesData) {
    try {
      // Check if branch already exists
      let branch = await Branch.findOne({ name: branchData.name });
      
      if (branch) {
        console.log(`⏭️  Skipping ${branchData.name} (already exists)`);
        skippedCount++;
        continue;
      }

      console.log(`\n📽️  Creating ${branchData.name}...`);
      
      // Create branch
      branch = await Branch.create({
        name: branchData.name,
        cinemaChain: branchData.chain,
        location: {
          address: branchData.address,
          city: branchData.city,
          province: branchData.province,
          coordinates: branchData.coordinates
        },
        contact: {
          phone: branchData.phone,
          email: `contact@${branchData.chain.toLowerCase()}.com`
        },
        theaters: [],
        operatingHours: {
          open: '09:00',
          close: '23:00'
        },
        facilities: branchData.facilities || ['Parking', '3D'],
        isActive: true
      });

      // Create 2-3 theaters for this branch
      const theaterIds = [];
      const numTheaters = branchData.facilities?.includes('IMAX') ? 3 : 2;
      
      for (let i = 1; i <= numTheaters; i++) {
        // Create theater
        const theater = await Theater.create({
          name: `${branchData.name} - Phòng ${i}`,
          branch: branch._id,
          seatLayout: null
        });
        
        theaterIds.push(theater._id);
        
        // Create seat layout
        const rows = 10;
        const seatsPerRow = 12;
        const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        
        const seatLayout = await SeatLayout.create({
          name: `${branchData.name} - Phòng ${i} Layout`,
          branch: branch._id,
          theater: theater._id,
          rows: rows,
          seatsPerRow: seatsPerRow,
          rowLabels: rowLabels,
          vipRows: ['H', 'I', 'J'],
          coupleSeats: [
            { row: 'F', startSeat: 5, endSeat: 8 },
            { row: 'G', startSeat: 5, endSeat: 8 }
          ],
          aisleAfterColumns: [6]
        });
        
        // Update theater with seat layout
        await Theater.findByIdAndUpdate(theater._id, { seatLayout: seatLayout._id });
        
        // Create seats
        const seats = [];
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          for (let col = 1; col <= seatsPerRow; col++) {
            let seatType = 'standard';
            if (rowIndex >= 7) seatType = 'vip';
            if (col >= 5 && col <= 8 && rowIndex >= 5 && rowIndex <= 6) seatType = 'couple';
            
            seats.push({
              row: rowLabels[rowIndex],
              number: col,
              type: seatType,
              theater: theater._id,
              branch: branch._id,
              isActive: true,
              position: {
                x: col - 1,
                y: rowIndex
              }
            });
          }
        }
        
        await Seat.insertMany(seats);
        console.log(`  ✓ Created ${seats.length} seats for Phòng ${i}`);
      }
      
      // Update branch with theaters
      await Branch.findByIdAndUpdate(branch._id, { theaters: theaterIds });
      
      console.log(`✅ ${branchData.name} created with ${numTheaters} theaters`);
      createdCount++;
      
    } catch (error) {
      console.error(`❌ Error creating ${branchData.name}:`, error.message);
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount} branches`);
  console.log(`   ⏭️  Skipped: ${skippedCount} branches (already exist)`);
  console.log(`   📍 Total: ${branchesData.length} branches\n`);
};

const main = async () => {
  await connectDB();
  await createBranches();
  await mongoose.connection.close();
  console.log('✅ Done!');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

