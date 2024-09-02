import express from 'express';
import userRoutes from './router/user';
import userMainRoutes from './router/userMain'; 

import cors from "cors";
const app = express();

export const SECRET = "secret";

app.use(express.json());
app.use(cors())

app.use('/v1/user',userRoutes);
app.use('/v1/userMain',userMainRoutes);

app.listen(3000,()=>{
    console.log("Server is running on port 3000")
}  )