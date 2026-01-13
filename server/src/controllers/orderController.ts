import { Request, Response } from 'express';
import prisma from '../prisma';

export const createOrder = async (req: Request, res: Response) => {
  const { items, total } = req.body; 
  // items espera ser: [{ productId: 1, quantity: 2, price: 1500 }]

  // HARDCODEADO POR AHORA (Para probar sin Login todavía)
  const userId = 1; 
  const clientId = 1; 

  try {
    // INICIO DE LA TRANSACCIÓN
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Verificar y Descontar Stock de cada producto
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Solo quedan ${product.stock}`);
        }

        // Restamos el stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity }
        });
      }

      // 2. Crear la Orden (Cabecera)
      const order = await tx.order.create({
        data: {
          total,
          userId,
          clientId,
          status: 'COMPLETADO',
          // 3. Crear los Items de la Orden (Detalle)
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: { items: true } // Para que nos devuelva qué items guardó
      });

      return order;
    });

    res.json(result);

  } catch (error: any) {
    console.error(error);
    // Si algo falla (ej: sin stock), la transacción se deshace sola y llega aquí
    res.status(400).json({ error: error.message || "Error al procesar la venta" });
  }
};