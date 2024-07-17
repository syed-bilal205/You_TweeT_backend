import { app } from "./src/app.js";
import { connectDb } from "./src/db/connectDB.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

connectDb()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}🌞`);
    });
  })
  .catch((error) => {
    console.log(`Error while connecting to DATABASE ${error}❌`);
  });
