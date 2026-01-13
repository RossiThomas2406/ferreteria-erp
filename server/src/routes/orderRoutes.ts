import { Router } from 'express';
import { createOrder } from '../controllers/orderController';
import { generateOrderPDF } from '../controllers/pdfController';

const router = Router();

router.post('/', createOrder);
router.get('/:id/pdf', generateOrderPDF);

export default router;