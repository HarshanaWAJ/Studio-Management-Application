import { AppDataSource } from "./src/config/data-source.js";
import { User } from "./src/models/User.js";
import bcrypt from "bcryptjs";

async function reset() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  
  const emailToReset = "janithharshana@2019@gmail.com";
  const user = await userRepo.findOne({ where: { email: emailToReset } });
  
  if (!user) {
    console.log("User not found!");
    process.exit(1);
  }
  
  const newPassword = "Password123!";
  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  
  await AppDataSource.manager.save(User, user);
  
  console.log(`Password for ${emailToReset} successfully reset to: ${newPassword}`);
  process.exit(0);
}

reset().catch(console.error);
