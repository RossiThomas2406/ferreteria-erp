import { useEffect, useState } from 'react';

// Tipos de datos
interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  // Cargar productos al iniciar
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    fetch('https://ferreteria-api-jq34.onrender.com/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  };

  // --- LÓGICA DEL CARRITO ---

  const addToCart = (product: Product) => {
    // 1. Validar Stock visualmente
    const existingItem = cart.find((item) => item.id === product.id);
    const quantityInCart = existingItem ? existingItem.quantity : 0;

    if (quantityInCart >= product.stock) {
      alert("¡No hay suficiente stock!");
      return;
    }

    // 2. Agregar o Incrementar
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Calcular Total
  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // --- LÓGICA DE COBRO (CHECKOUT) ---
  
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!confirm(`¿Confirmar venta por $${total.toLocaleString()}?`)) return;

    try {
      // Armamos el JSON tal cual lo hicimos en Thunder Client
      const saleData = {
        total: total,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }))
      };

      const response = await fetch('https://ferreteria-api-jq34.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const json = await response.json(); // Leemos la respuesta
        setLastOrderId(json.id);            // Guardamos el ID de la venta
        setCart([]);                        // Vaciamos el carrito
        fetchProducts();                    // Recargamos stock
      } else {
        const error = await response.json();
        alert("Error: " + error.error);
      }

    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: PRODUCTOS (Ocupa 2 espacios) */}
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">📦 Catálogo</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? <p>Cargando productos...</p> : products.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                    <p className="text-gray-500 text-sm">Stock: {product.stock} u.</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
                    ${parseFloat(product.price).toLocaleString()}
                  </span>
                </div>
                
                <button 
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className={`mt-4 w-full py-2 rounded font-semibold text-white transition
                    ${product.stock > 0 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                </button>
              </div>
            ))}
          </div>  
        </div>

        {/* COLUMNA DERECHA: TICKET (Ocupa 1 espacio) */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-lg sticky top-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">🛒 Nueva Venta</h2>
              {lastOrderId && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded relative">
                  
                  {/* Botón X para cerrar el aviso manualmente */}
                  <button 
                    onClick={() => setLastOrderId(null)}
                    className="absolute top-2 right-2 text-green-800 hover:text-green-900 font-bold"
                  >
                    ✕
                  </button>

                  <p className="font-bold">¡Venta Exitosa! Orden #{lastOrderId}</p>
                  
                  <a 
                    href={`https://ferreteria-api-jq34.onrender.com/api/orders/${lastOrderId}/pdf`}
                    target="_blank"
                    className="mt-2 block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center"
                    // ELIMINAMOS EL ONCLICK DE AQUÍ para que no desaparezca al descargar
                  >
                    📄 DESCARGAR FACTURA
                  </a>
                </div>
              )}
            
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8">El carrito está vacío</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} x ${parseFloat(item.price).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        ${(item.quantity * parseFloat(item.price)).toLocaleString()}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 font-bold px-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TOTAL Y BOTÓN PAGAR */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total a Pagar:</span>
                <span className="text-2xl font-bold text-green-700">
                  ${total.toLocaleString()}
                </span>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded-lg font-bold text-white text-lg transition
                  ${cart.length > 0 
                    ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl' 
                    : 'bg-gray-300 cursor-not-allowed'}`}
              >
                CONFIRMAR VENTA
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default App;