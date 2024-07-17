import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(process.env.MONGO_URI);
    console.log(
      `MongoDB Connected: ${connectionInstance.connection.host}🌞`
    );
  } catch (error) {
    console.log(`Error while connecting to DB ${error}❌`);
    process.exit(1);
  }
};
