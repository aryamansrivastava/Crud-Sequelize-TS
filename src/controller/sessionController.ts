import {Request, Response} from 'express';
import {z} from 'zod';
import db from '../models/index';

const startSessionSchema = z.object({
    userId: z.number().int().positive(),        
    start_time: z.string().datetime(),
});

const getSessionSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
});

export const startSession = async (req: Request, res: Response) => {
    try {
        const { userId, start_time } = startSessionSchema.parse(req.body);
        const session = await db.models.Session.create({
            userId,
            start_time: new Date(start_time),
        });
        res.status(201).json({
            status: "success",
            message: "Session Started",
            data: session,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid input data',
                data: error.errors,
            });
        } else {
            console.error('Error Creating Session:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to start session',
                data: error.message || 'Internal Server Error',
            });
        }
    }
    return;
};

export const getSessionById = async (req: Request, res: Response) => {
    try {
        const {id} = getSessionSchema.parse(req.params);
        const session = await db.models.Session.findByPk(id);
        if(!session){
            res.status(404).json({
                status: 'error',
                message: 'Session not found',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Session retrieved successfully',
            data: session,
        });
    } catch (error: any) {
        if(error instanceof z.ZodError) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid Id',
                data: error.errors,
            });
        } else {
            console.error('Error Retrieving Session:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve session',
                data: error.message || 'Internal Server Error',
            });
        }
    }
};