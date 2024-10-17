import dotenv from "dotenv";
import { prisma } from "./config/db.config.js";
import app from "./app.js";

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 5000;

prisma
  .$connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });
