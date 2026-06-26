import { AppDataSource } from "./src/config/data-source.js";
import { User } from "./src/models/User.js";

async function fixEmail() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  
  // Find the typo email
  const user = await userRepo.findOne({ where: { email: "janithharshana@2019@gmail.com" } });
  
  if (!user) {
    console.log("Could not find user with the typo email.");
    process.exit(1);
  }
  
  // Change it to the correct email
  const newEmail = "janithharshana2019@gmail.com";
  user.email = newEmail;
  await AppDataSource.manager.save(User, user);
  
  console.log(`Successfully changed email in database from 'janithharshana@2019@gmail.com' to '${newEmail}'.`);
  process.exit(0);
}

fixEmail().catch(console.error);
