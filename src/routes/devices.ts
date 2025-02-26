import express from 'express';
import { getDeviceById, createDevice } from '../controller/deviceController';

const deviceRouter = express.Router();

deviceRouter.get('/:id', getDeviceById  );

deviceRouter.post('/', createDevice);

export default deviceRouter;