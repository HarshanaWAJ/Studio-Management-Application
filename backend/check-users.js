import { AppDataSource } from "./src/config/data-source.js";
import { User } from "./src/models/User.js";
import { Studio } from "./src/models/Studio.js";

async function check() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ relations: { studio: true } });
  
  console.log("USERS IN DATABASE:");
  users.forEach(u => {
    console.log(`- ID: ${u.id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Name: ${u.firstName} ${u.lastName}`);
    console.log(`  Studio: ${u.studio?.studioName}`);
    console.log(`  Active: ${u.isActive}`);
  });
  
  process.exit(0);
}

check().catch(console.error);
