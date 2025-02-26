import express, { Request, Response } from 'express';
import { getUserDevice } from '../utils/getUserDevice';
import {z} from "zod";
import db from '../models/index';

const deviceRouter = express.Router();

const getDeviceSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

const createDeviceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    userId: z.number().int().positive('userId must be a positive integer'),
});  

deviceRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const userDevices = await db.models.Device.findAll({
      where: { userId },
      attributes: ['name'],
    });
    const deviceType = getUserDevice(req);

    res.status(200).json({
      status: 'success',
      devices: userDevices,
      loggedInFrom: deviceType
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get devices',
      data: error.message || 'Internal Server Error',
    });
  }
  return;
});

deviceRouter.post('/', async (req: Request, res: Response) => {
    try {
    //   console.log('Request Body:', req.body);
      const { name, userId } = req.body;
      const newDevice = await db.models.Device.create({
        name,
        userId
      });
      res.status(201).json({
        status: 'success',
        message: 'Device created successfully',
        data: newDevice
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create device',
        data: error.message || 'Internal Server Error',
      });
    }
    return;
  });

export default deviceRouter;