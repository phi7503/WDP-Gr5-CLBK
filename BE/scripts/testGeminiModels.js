import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testModels() {
  const modelNames = [
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
  ];

  console.log("🔍 Testing available Gemini models...\n");

  for (const modelName of modelNames) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} - SUCCESS!`);
      console.log(`   Response: ${text.substring(0, 50)}...\n`);
      return modelName; // Return first working model
    } catch (error) {
      console.log(`❌ ${modelName} - FAILED: ${error.message}\n`);
    }
  }

  console.log("❌ No working models found!");
  return null;
}

testModels()
  .then((workingModel) => {
    if (workingModel) {
      console.log(`\n✅ Recommended model: ${workingModel}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });


