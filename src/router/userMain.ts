
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from 'jsonwebtoken';
import { SECRET } from "../index";
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

const router = Router();
const prisma = new PrismaClient();

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.ACCESS_SECRET ?? "",
    },
    region: "us-east-1"
})


router.get("/presignedurl",async (req,res)=>{
    // @ts-ignore
    const userid = req.userId;
   

    const {url,fields} = await createPresignedPost(s3Client,{
        Bucket:"dcfiver",
        Key:`dcfiver/${userid}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields:{
            
            'Content-Type': 'image/jpeg'
        },
        Expires: 3600
    })
   
    console.log(url,fields);
    res.json({
        url: url   
    })


})


router.post('/signin', async (req, res) => {
    const wall_address = "8DxCZfvvcRkoMevSTFix1CZ4hATSmnVh2AVPD8o9HSd9";

    const existingUser = await prisma.user.findFirst({
        where: {
            address: wall_address
        }
    });

    if (existingUser) {
        const token = jwt.sign({ userid: existingUser.id }, SECRET);
        res.json({ token });
    } else {
        const user = await prisma.user.create({
            data: {
                address: wall_address
            }
        });

        const token = jwt.sign({ userid: user.id }, SECRET);
        res.json({ token });
    }
});

export default router;
