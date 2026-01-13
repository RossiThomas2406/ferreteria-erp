import { Request, Response } from 'express';
import prisma from '../prisma';

// 1. Crear un Producto
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock, description } = req.body;
    
    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        stock,
        description
      }
    });

    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto" });
  }
};

// 2. Listar Productos (Solo los NO borrados)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null // ¡Clave para el Soft Delete!
      },
      orderBy: {
        id: 'desc'
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
};