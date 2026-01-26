import mongoose from "mongoose";
import userModel from "./models/userModel.js";
import productModel from "./models/productModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const MONGO_URI = "mongodb://127.0.0.1:27017/foodhub";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected for seeding...");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Read JSON files
const readJsonFile = (filename) => {
  const filePath = path.join(__dirname, "..", filename);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log("Clearing existing data...");
    await userModel.deleteMany({ role: "restaurant" });
    await productModel.deleteMany({});
    console.log("Existing data cleared.");

    // Read data files
    const restaurantsData = readJsonFile("restaurantsData.json");
    const foodData = readJsonFile("foodData2.json");

    // Create restaurants and map their names to IDs
    const restaurantMap = new Map();
    console.log("\nCreating restaurants...");

    for (const restaurant of restaurantsData) {
      if (restaurant.role === "restaurant") {
        const newRestaurant = await userModel.create(restaurant);
        restaurantMap.set(restaurant.restaurantName, newRestaurant._id);
        console.log(`  ✓ Created: ${restaurant.restaurantName}`);
      }
    }

    console.log(`\n${restaurantMap.size} restaurants created.`);

    // Create products
    console.log("\nCreating products...");
    let productCount = 0;

    for (const item of foodData) {
      const restaurantId = restaurantMap.get(item.restaurantName);

      if (!restaurantId) {
        console.log(`  ✗ Skipping: ${item.name} - Restaurant not found: ${item.restaurantName}`);
        continue;
      }

      await productModel.create({
        restaurantId,
        categoryName: item.categoryName,
        name: item.name,
        img: item.img,
        options: item.options,
        description: item.description,
        isAvailable: true,
      });

      productCount++;
      console.log(`  ✓ Added: ${item.name} (${item.restaurantName})`);
    }

    console.log(`\n${productCount} products created.`);

    // Summary
    console.log("\n========== SEEDING COMPLETE ==========");
    console.log(`Restaurants: ${restaurantMap.size}`);
    console.log(`Products: ${productCount}`);
    console.log("\nRestaurant Login Credentials:");
    console.log("Email: [restaurantname]@foodhub.pk");
    console.log("Password: restaurant123");
    console.log("\nExample: karachi.biryani@foodhub.pk / restaurant123");
    console.log("=======================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
