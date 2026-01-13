import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares (Configuración básica)
app.use(cors()); // Permite que el Frontend se conecte
app.use(express.json()); // Permite recibir JSON en los POST

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de prueba
app.get('/ping', (req, res) => {
  res.send('¡Pong! El servidor está vivo 🚀');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});