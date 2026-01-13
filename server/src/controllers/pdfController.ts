import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../prisma';

export const generateOrderPDF = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Buscar la orden con sus productos y cliente
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { 
        client: true,
        items: { include: { product: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    // 2. Configurar el PDF
    const doc = new PDFDocument({ margin: 50 });

    // 3. Configurar la respuesta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${order.id}.pdf`);

    // Conectar el PDF al stream de respuesta
    doc.pipe(res);

    // --- DISEÑO DE LA FACTURA ---

    // Encabezado
    doc.fontSize(20).text('Ferretería Industrial', { align: 'center' });
    doc.fontSize(12).text('Comprobante de Venta', { align: 'center' });
    doc.moveDown();

    // Datos del Cliente
    doc.fontSize(10);
    doc.text(`Fecha: ${order.date.toLocaleDateString()}`);
    doc.text(`Cliente: ${order.client.name}`);
    doc.text(`CUIT: ${order.client.cuit}`);
    doc.text(`Nro Orden: #${order.id}`);
    doc.moveDown();
    
    // Línea separadora superior
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // --- TABLA DE PRODUCTOS (SOLUCIÓN DE COLUMNAS FIJAS) ---

    // Definimos las posiciones X exactas donde empieza cada columna
    const colProductoX = 50;
    const colCantidadX = 320;
    const colPrecioX = 380;
    const colTotalX = 480;

    // Altura inicial de los títulos de la tabla
    const tableTop = doc.y;

    doc.font('Helvetica-Bold');
    doc.text('Producto', colProductoX, tableTop);
    doc.text('Cant.', colCantidadX, tableTop);
    doc.text('Precio U.', colPrecioX, tableTop);
    doc.text('Total', colTotalX, tableTop);

    doc.font('Helvetica');
    doc.moveDown();

    // Línea separadora fina debajo de los títulos
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Iteramos los productos
    order.items.forEach(item => {
      const y = doc.y; // Guardamos la altura actual de la fila
      const totalItem = item.quantity * Number(item.price);

      // Columna 1: Producto (con ancho máximo para que baje de línea si es largo)
      doc.text(item.product.name, colProductoX, y, { width: 260 });
      
      // Columna 2: Cantidad
      doc.text(item.quantity.toString(), colCantidadX, y);
      
      // Columna 3: Precio Unitario (Formateado)
      doc.text(`$${Number(item.price).toFixed(2)}`, colPrecioX, y);
      
      // Columna 4: Total del Item (Formateado)
      doc.text(`$${totalItem.toFixed(2)}`, colTotalX, y);

      // Bajamos el cursor para la siguiente fila
      doc.moveDown(); 
    });

    doc.moveDown();
    
    // Línea separadora final
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown();

    // Total Final
    doc.fontSize(16).font('Helvetica-Bold');
    // Alineamos a la derecha usando el ancho de la página (aprox 550 es el margen derecho)
    doc.text(`TOTAL: $${Number(order.total).toLocaleString()}`, 350, doc.y, { align: 'right', width: 200 });

    // 4. Finalizar el PDF
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando PDF" });
  }
};