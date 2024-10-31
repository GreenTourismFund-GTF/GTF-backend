import mongoose from "mongoose";

const connectDB = async (db: string) => {
  try {
    const con: any = await mongoose.connect(db);
    console.log(`Database connected with ${con.connection.host}`);
  } catch (err: any) {
    console.log(err);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
