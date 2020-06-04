import express from 'express';
import employee from './employee.route';

const router = express.Router();

router.use('/employees', employee);
module.exports = router;
