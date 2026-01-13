import { Router } from 'express';
import { createProduct, getProducts } from '../controllers/productController';

const router = Router();

// Definimos las URLs:
// GET http://localhost:3000/api/products
router.get('/', getProducts);

// POST http://localhost:3000/api/products
router.post('/', createProduct);

export default router;