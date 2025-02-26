import {Request, Response} from "express";
import {z} from "zod";
import db from "../models/index";
import {getUserDevice} from "../utils/getUserDevice";

const getDeviceSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

const createDeviceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    userId: z.number().int().positive('userId must be a positive integer'),
});

export const getDeviceById = async (req: Request, res: Response) => {   
    try {
        const validated = getDeviceSchema.parse(req.params);
        const userId = parseInt(validated.id);

        const userDevices = await db.models.Device.findAll({
            where: { userId },      
            attributes: ['name'],
        });
        const deviceType = getUserDevice(req);

        res.status(200).json({
            status: 'success',  
            devices: userDevices,
            loggedInFrom: deviceType,
    });
    } catch (error: any) {
        if(error instanceof z.ZodError) {
            res.status(400).json({
                status: false,
                message: 'Invalid request data',
                data: error.errors,
            });
        }
        else{
            console.error(error);
            res.status(500).json({
                status: false,
                data: error.message || 'Internal Server Error',
            });
        }
    }
};

export const createDevice = async (req: Request, res: Response) => {    
    try {
        const validated = createDeviceSchema.parse(req.body);
        const { name, userId } = validated;

        const newDevice = await db.models.Device.create({
            name,
            userId
        });
        res.status(201).json({
            status: 'success',
            message: 'Device created successfully',
            data: newDevice
        });
    }
    catch (error: any) {
        if(error instanceof z.ZodError) {
            res.status(400).json({
                status: false,
                message: 'Invalid request data',
                error: error.errors,
            });
        }
        else {
            console.error(error);
            res.status(500).json({
                status: false,
                data: error.message || 'Internal Server Error',
            });
        }
    }
};