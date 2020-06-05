import express from 'express';
import { addEmployee, getEmployeeList, 
        updateEmployee, deleteEmployee } from '../controllers/employee/employee.controller';
import { addEmployeeMid, getEmployeeMid, 
        updateEmployeeMid, deleteEmployeeMid } from '../middlewares/Employee/employee.middleware';

const router = express.Router();

router.post('/', addEmployeeMid, addEmployee);
router.get('/:name?/:sortBy?/:orderBy?/:limit?/:offset?', getEmployeeMid, getEmployeeList);
router.put('/employee_id/:employeeId', updateEmployeeMid, updateEmployee);
router.delete('/', deleteEmployeeMid, deleteEmployee);

export default router;
