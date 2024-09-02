import { z } from 'zod';

export const createTaskInput = z.object({
    title: z.string(),
    signature: z.string(),
    options: z.array(z.object({
        imageUrl: z.string().url() // Assuming imageUrl should be a valid URL
    }))
});


export const createSubmissionInput = z.object({
    taskid: z.string(),
    selection: z.string(),
});