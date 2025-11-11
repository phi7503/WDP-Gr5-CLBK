import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log("🔍 Testing Gemini API...\n");
console.log(`API Key present: ${API_KEY ? '✅ Yes' : '❌ No'}`);
console.log(`API Key length: ${API_KEY ? API_KEY.length : 0} characters\n`);

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env file!");
  console.error("Get your API key at: https://makersuite.google.com/app/apikey");
  process.exit(1);
}

// Test 1: Direct REST API call to list models
async function testRestAPI() {
  try {
    console.log("📡 Testing REST API to list models...");
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );
    
    console.log("✅ Successfully connected to Gemini API!\n");
    console.log("Available models:");
    
    const models = response.data.models || [];
    const generateContentModels = models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );
    
    if (generateContentModels.length > 0) {
      generateContentModels.forEach((model, idx) => {
        const modelName = model.name.replace('models/', '');
        console.log(`  ${idx + 1}. ${modelName}`);
      });
      
      const recommendedModel = generateContentModels[0].name.replace('models/', '');
      console.log(`\n💡 Use this model: "${recommendedModel}"`);
      return recommendedModel;
    } else {
      console.log("❌ No models found that support generateContent");
      return null;
    }
  } catch (error) {
    console.error("❌ REST API Error:", error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.error("\n⚠️  API Key doesn't have permission or API not enabled!");
      console.error("1. Check if Gemini API is enabled in Google Cloud Console");
      console.error("2. Verify API key has correct permissions");
      console.error("3. Try creating a new API key");
    } else if (error.response?.status === 401) {
      console.error("\n⚠️  Invalid API Key!");
      console.error("Get a new API key at: https://makersuite.google.com/app/apikey");
    }
    
    return null;
  }
}

// Test 2: Try SDK with different model
async function testSDK(modelName) {
  try {
    console.log(`\n🧪 Testing SDK with model: "${modelName}"...`);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ SDK works with "${modelName}"!`);
    console.log(`   Response: ${text.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error(`❌ SDK failed with "${modelName}": ${error.message}`);
    return false;
  }
}

// Run tests
testRestAPI()
  .then(async (modelName) => {
    if (modelName) {
      await testSDK(modelName);
      console.log(`\n✅ Update aiService.js to use: "${modelName}"`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });


