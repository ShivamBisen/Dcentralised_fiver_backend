import { PrismaClient } from '@prisma/client';
import {Router} from 'express';
import jwt from 'jsonwebtoken';
import { SECRET } from '../index';
import { authMiddleware } from '../middleware';
import { createSubmissionInput } from './types';

const TOTAL_SUBMISSIONS = 100;


const router = Router();

const prisma = new PrismaClient();

router.post("/payout", authMiddleware, async (req,res) => {
    // @ts-ignore
     const userid = req.userid;
    const user = await prisma.user.findFirst({
        where:{
            id:userid
        }
    })
    const address = user?.address;

    const trxid = "1234";

    await prisma.$transaction(async tx => {
        await tx.user.update({
            where:{
                id: Number(userid)
            },
            data:{
                pendingAmount:{
                    decrement: Number(user?.pendingAmount)

                },
                lockedAmount:{
                    increment: Number(user?.pendingAmount)
                }
            }
        })

        await tx.payouts.create({
            data:{
                amount:Number(user?.pendingAmount),
                user_id:userid,
                signature:trxid,
                status:"Processing"
            }
        })
    })

    res.json({

        
        amount:user?.pendingAmount,
    })

})

router.get("/balance", authMiddleware, async (req, res)=>{
    // @ts-ignore
    const userid = req.userid;

    const user = await prisma.user.findFirst({
        where:{
            id:userid
        }
    })
    res.json({
        pendingAbount:user?.pendingAmount,
        lockedAmount:user?.lockedAmount
    })

})


router.post("/submission", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userid = req.userid;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if (parsedBody.success) {
        const task = await prisma.task.findFirst({
            where:{
                done:false,
                submissions:{
                    none:{
                        user_id:Number(userid),
    
                    }
                }
            },
            select:{
                title:true,
                options:true,
                id:true,
                amount:true
            }
        })
      
        if (!task || task?.id !== Number(parsedBody.data.taskid)) {
            return res.status(411).json({
                message: "Incorrect task id"
            })
        }
       
        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();

        const submission = await prisma.$transaction(async tx => {
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    user_id: userid,
                    task_id: Number(parsedBody.data.taskid),
                 
                    amount: Number(amount)
                }
            })

            await tx.user.update({
                where: {
                    id: userid,
                },
                data: {
                    pendingAmount: {
                        increment: Number(amount)
                    }
                }
            })

            return submission;
        })

        const tasks = await prisma.task.findFirst({
            where:{
                done:false,
                submissions:{
                    none:{
                        user_id:Number(userid),
    
                    }
                }
            },
            select:{
                title:true,
                options:true,
                id:true,
                amount:true
            }
        })
        res.json({
            tasks,
            amount
        })
        

    } else {
        res.status(411).json({
            message: "incorrect inputs"
        })
            
    }

})


router.get('/taskfeed',authMiddleware,async(req,res)=>{
    // @ts-ignore
    const userid = req.userid;
    const tasks = await prisma.task.findFirst({
        where:{
            done:false,
            submissions:{
                none:{
                    user_id:Number(userid),

                }
            }
        },
        select:{
            title:true,
            options:true,
            id:true,
            amount:true
        }
    })

    if(!tasks){
        res.json({message:"No tasks available"})
    }
    else{
        res.json(tasks)
    }
})

router.post('/signin',async(req,res)=>{

    // const { publicKey, signature } = req.body;
    // const message = new TextEncoder().encode("Sign into mechanical turks as a worker");

    // const result = nacl.sign.detached.verify(
    //     message,
    //     new Uint8Array(signature.data),
    //     new PublicKey(publicKey).toBytes(),
    // );

    // if (!result) {
    //     return res.status(411).json({
    //         message: "Incorrect signature"
    //     })
    // }
    const publicKey = "ljkhfgikdfgkdfhg"

    const existingUser = await prisma.user.findFirst({
        where:{
            address:publicKey
        }
    })
    if(!existingUser){
        const user = await prisma.user.create({
            data:{
                address:publicKey

            }
        })
        const token = jwt.sign({userid:user.id},SECRET)
        res.json({"token":token})
        
    }
     else{
        const token = jwt.sign({userid:existingUser.id},SECRET)
        res.json({"token":token})
     }


})

export default router;