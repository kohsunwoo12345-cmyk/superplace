"use client";

import { useState, useEffect } from "react";

export default function StoreDebugPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🛒 Loading products from API...');
        const response = await fetch('/api/admin/store-products?activeOnly=true');
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Response:', data);
          setProducts(data.products || []);
        } else {
          setError(`API Error: ${response.status} ${response.statusText}`);
        }
      } catch (err: any) {
        console.error('❌ Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Store Products Debug</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p>Total Products: {products.length}</p>
        <p>Active Products: {products.filter(p => p.isActive).length}</p>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.id} className="border rounded p-4 bg-white">
            <h3 className="font-bold text-lg mb-2">#{index + 1}: {product.name}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>ID:</strong> {product.id}</div>
              <div><strong>Category:</strong> {product.category}</div>
              <div><strong>Price:</strong> {product.price}</div>
              <div><strong>Monthly:</strong> {product.monthlyPrice}</div>
              <div><strong>Per Student:</strong> {product.pricePerStudent}</div>
              <div><strong>Active:</strong> {product.isActive ? 'Yes' : 'No'}</div>
              <div><strong>Featured:</strong> {product.isFeatured ? 'Yes' : 'No'}</div>
              <div className="col-span-2"><strong>Description:</strong> {product.shortDescription || product.description}</div>
              <div className="col-span-2"><strong>Image URL:</strong> {product.imageUrl || '(empty)'}</div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          No products found in database
        </div>
      )}
    </div>
  );
}
