import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    console.log("🔍 Listing available Gemini models...\n");
    
    // List models using the API
    const models = await genAI.listModels();
    
    console.log("✅ Available models:");
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName || 'N/A'}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    });
    
    // Filter models that support generateContent
    const generateContentModels = models.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    );
    
    if (generateContentModels.length > 0) {
      console.log("\n✅ Models that support generateContent:");
      generateContentModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
      });
      
      // Return first working model name (without 'models/' prefix)
      const firstModel = generateContentModels[0].name.replace('models/', '');
      console.log(`\n💡 Recommended model name: "${firstModel}"`);
      return firstModel;
    } else {
      console.log("\n❌ No models found that support generateContent");
      return null;
    }
  } catch (error) {
    console.error("❌ Error listing models:", error.message);
    
    if (error.message.includes("API key")) {
      console.error("\n⚠️  Possible issues:");
      console.error("1. GEMINI_API_KEY is missing or invalid in .env file");
      console.error("2. API key doesn't have permission to list models");
      console.error("3. Check your API key at: https://makersuite.google.com/app/apikey");
    }
    
    return null;
  }
}

listModels()
  .then((modelName) => {
    if (modelName) {
      console.log(`\n✅ Use this model name in aiService.js: "${modelName}"`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });


