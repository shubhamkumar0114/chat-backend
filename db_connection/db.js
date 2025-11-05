import mongoose from "mongoose";

async function connectMongodb(url){
    try {
       await mongoose.connect(url)
       console.log("mongodb connect successfull")
    } catch (error) {
        return console.log("Db connectin error")
    }
}

export default connectMongodb