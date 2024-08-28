import express from 'express';
import userRoutes from './router/user';
import userMainRoutes from './router/userMain'; 
const app = express();
export const SECRET = "secret";

app.use('/v1/user',userRoutes);
app.use('/v1/userMain',userMainRoutes);

app.listen(3000,()=>{
    console.log("Server is running on port 3000")
}  )