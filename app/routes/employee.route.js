import express from 'express';
import { addEmployee } from '../controllers/employee/employee.controller';
import { addEmployeeMid } from '../middlewares/Employee/employee.middleware';

const router = express.Router();

router.post('/', addEmployeeMid, addEmployee);

export default router;
