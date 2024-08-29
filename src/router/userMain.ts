
import { PrismaClient } from "@prisma/client";
import { Router, response } from "express";
import jwt from 'jsonwebtoken';
import { SECRET } from "../index";
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { authMiddleware } from "../middleware";
import { createTaskInput } from "./types";
import { number } from "zod";

const router = Router();
const prisma = new PrismaClient();

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.ACCESS_SECRET ?? "",
    },
    region: "us-east-1"
})


router.get("/task", authMiddleware, async (req, res) => {
    // @ts-ignore
    const taskid: string = req.query.taskid;
    // @ts-ignore
    const userid: string = req.userid;

    const taskDetails = await prisma.task.findFirst({
        where: {
            user_id: Number(userid),
            id: Number(taskid)
        },
        include: {
            options: true
        }
    })

    if (!taskDetails) {
        return res.status(411).json({
            message: "You dont have access to this task"
        })
    }

    // Todo: Can u make this faster?
    const responses = await prisma.submission.findMany({
        where: {
            task_id: Number(taskid)
        },
        include: {
            option: true
        }
    });

    const result: Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image
            }
        }
    })

    responses.forEach(r => {
        result[r.option_id].count++;
    });

    res.json({
        result,
        taskDetails
    })

})


router.post("/task", authMiddleware, async (req, res) => {
    try {
        // @ts-ignore
        const userid = req.userid;
        const body = req.body;

        const parseData = createTaskInput.safeParse(body);

        if (!parseData.success) {
            return res.status(400).json({ error: parseData.error });
        }
        console.log(userid);
        // Ensure userid is valid
        if (!userid) {
            return res.status(400).json({ error: "User ID is missing" });
        }

        // Check if UserMain exists with the provided userid
        const userExists = await prisma.userMain.findUnique({
            where: { id: userid }
        });

        if (!userExists) {
            console.log("No UserMain found with this ID");
            return res.status(404).json({ error: "User not found" });
        }

        console.log("User found, proceeding with transaction");

        const response = await prisma.$transaction(async (tx) => {
            const task = await tx.task.create({
                data: {
                    title: parseData.data.title ?? "Untitled",
                    amount: '1',
                    signature: parseData.data.signature,
                    user: {
                        connect: { id: userid }
                    }
                }
            });

            await tx.options.createMany({
                data: parseData.data.options.map(e => ({
                    image: e.imageUrl,
                    task_id: task.id
                }))
            });

            return task;
        });

        res.json(response);

    } catch (error) {
        console.error("Error during transaction:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




router.get("/presignedUrl", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'dcfiver',
        Key: `fiver/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields:{
            success_action_status: '201',
            'Content-Type': 'image/jpeg'
        },
        Expires: 3600
    })

    res.json({  
        preSignedUrl: url,
        fields
    })
    
})



router.post('/signin', async (req, res) => {
    const wall_address = "8DxCZfvvcRkoMevSTFix1CZ4hATSmnVh2AVPD8o5HSd9";

    const existingUser = await prisma.userMain.findFirst({
        where: {
            address: wall_address
        }
    });

    if (existingUser) {
        const token = jwt.sign({ userid: existingUser.id }, SECRET);
        res.json({ token });
    } else {
        const user = await prisma.userMain.create({
            data: {
                address: wall_address
            }
        });

        const token = jwt.sign({ userid: user.id }, SECRET);
        res.json({ token });
    }
});

export default router;
