/**
 * Script to export entire database to JSON files
 * Usage: node scripts/exportDatabase.js
 * 
 * This script exports all collections to separate JSON files
 * and also creates a combined JSON file with all data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Convert ObjectId and Date to string for JSON serialization
const serializeDocument = (doc) => {
  if (!doc) return null;
  
  if (doc.toObject) {
    doc = doc.toObject();
  }
  
  // Recursively process the object
  const processValue = (value) => {
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle ObjectId
    if (mongoose.Types.ObjectId.isValid(value) && value.toString && value.toString().length === 24) {
      return value.toString();
    }
    
    // Handle Date
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      const processed = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          processed[key] = processValue(value[key]);
        }
      }
      return processed;
    }
    
    return value;
  };
  
  return processValue(doc);
};

// Export a collection to JSON file
const exportCollection = async (collectionName, outputDir) => {
  try {
    const collection = mongoose.connection.db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    
    // Serialize documents
    const serialized = documents.map(serializeDocument);
    
    // Create output file path
    const fileName = `${collectionName}.json`;
    const filePath = path.join(outputDir, fileName);
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), 'utf8');
    
    console.log(`✅ Exported ${collectionName}: ${documents.length} documents -> ${fileName}`);
    
    return {
      collection: collectionName,
      count: documents.length,
      data: serialized
    };
  } catch (error) {
    console.error(`❌ Error exporting ${collectionName}:`, error.message);
    return {
      collection: collectionName,
      count: 0,
      data: [],
      error: error.message
    };
  }
};

// Main export function
const exportDatabase = async () => {
  try {
    // Create output directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputDir = path.join(__dirname, '..', 'exports', `export-${timestamp}`);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`\n📁 Export directory: ${outputDir}\n`);
    
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log(`📊 Found ${collectionNames.length} collections:\n`);
    collectionNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });
    console.log('');
    
    // Export each collection
    const exportResults = [];
    for (const collectionName of collectionNames) {
      const result = await exportCollection(collectionName, outputDir);
      exportResults.push(result);
    }
    
    // Create summary file
    const summary = {
      exportDate: new Date().toISOString(),
      database: mongoose.connection.name,
      totalCollections: collectionNames.length,
      collections: exportResults.map(r => ({
        name: r.collection,
        count: r.count,
        hasError: !!r.error
      })),
      totalDocuments: exportResults.reduce((sum, r) => sum + r.count, 0)
    };
    
    const summaryPath = path.join(outputDir, '_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`\n✅ Summary saved to: _summary.json\n`);
    
    // Create combined JSON file (optional - can be large)
    const combinedData = {};
    exportResults.forEach(result => {
      if (!result.error) {
        combinedData[result.collection] = result.data;
      }
    });
    
    const combinedPath = path.join(outputDir, '_all_data.json');
    fs.writeFileSync(combinedPath, JSON.stringify(combinedData, null, 2), 'utf8');
    console.log(`✅ Combined data saved to: _all_data.json\n`);
    
    // Print final summary
    console.log('🎉 Export completed!\n');
    console.log('📊 Summary:');
    console.log(`   Total collections: ${summary.totalCollections}`);
    console.log(`   Total documents: ${summary.totalDocuments}`);
    console.log(`   Export location: ${outputDir}\n`);
    
    // List all exported files
    console.log('📄 Exported files:');
    const files = fs.readdirSync(outputDir);
    files.forEach((file, index) => {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ${index + 1}. ${file} (${sizeInMB} MB)`);
    });
    
    return outputDir;
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    throw error;
  }
};

// Main execution
(async () => {
  try {
    await connectDB();
    await exportDatabase();
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();

