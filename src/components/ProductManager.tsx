import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadProducts();
  }, [currentUser]);

  const loadProducts = async () => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'products'),
      where('shopkeeperId', '==', currentUser.uid)
    );
    const snapshot = await getDocs(q);
    const productsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    setProducts(productsData);
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.trim() || !currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        name: newProduct.trim(),
        shopkeeperId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setNewProduct('');
      await loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Manage Products</h2>

      <form onSubmit={addProduct} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            placeholder="Enter product name"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>{product.name}</span>
            <button
              onClick={() => deleteProduct(product.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

