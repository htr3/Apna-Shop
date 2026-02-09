// ...existing code...
import ProductManager from '../components/ProductManager';

export default function Dashboard() {
  // ...existing code...
  const [showProductManager, setShowProductManager] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ...existing code... */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          {/* ...existing code... */}
          <button
            onClick={() => setShowProductManager(!showProductManager)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {showProductManager ? 'Hide Products' : 'Manage Products'}
          </button>
        </div>

        {showProductManager && (
          <div className="mb-6">
            <ProductManager />
          </div>
        )}

        {/* ...existing code... */}
      </div>
    </div>
  );
}

