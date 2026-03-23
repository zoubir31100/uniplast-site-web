
import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, Order, ViewMode, SortOption, AppConfig } from './types';
import { 
  getStoredProducts, saveStoredProducts, getStoredOrders, 
  getStoredPin, saveStoredPin, getStoredCategories, saveStoredCategories,
  getStoredConfig, saveStoredConfig
} from './utils/storage';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { CartModal } from './components/CartModal';
import { Invoice } from './components/Invoice';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { FilterDrawer } from './components/FilterDrawer';
import { HeroSlider } from './components/HeroSlider';
import { ProductDetail } from './components/ProductDetail';
import { StatsView } from './components/StatsView';

function App() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<ViewMode>('CATALOG');
  const [darkMode, setDarkMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('DEFAULT');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ 
    logo: null, 
    globalBanner: null, 
    categoryBanners: {},
    stickyBanner: false,
    bannerPositions: {},
    hidePrice: false,
    priceLabel: 'السعر'
  });
  
  // UI State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Admin State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('1234');

  // Modal State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // History State
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Init
  useEffect(() => {
    // CRITICAL FIX: Sanitize products on load to prevent white screen crashes
    const rawProducts = getStoredProducts();
    const cleanProducts = rawProducts.filter(p => p && p.id && p.name); // Only keep valid products
    
    if (rawProducts.length !== cleanProducts.length) {
      console.warn('Found corrupted products, cleaning...');
      saveStoredProducts(cleanProducts);
    }

    setProducts(cleanProducts);
    setOrderHistory(getStoredOrders());
    setAdminPin(getStoredPin());
    setCustomCategories(getStoredCategories());
    setAppConfig(getStoredConfig());
    
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Theme Toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Helper to reset view to catalog
  const resetToCatalog = () => {
    setView('CATALOG');
    setSearchValue('');
    setSelectedCategory('ALL');
  };

  // Cart Logic
  const addToCart = (product: Product, quantityCartons: number) => {
    // If there is an active discount, use the discount price
    const activePrice = (product.discountPrice && product.discountEndDate && new Date(product.discountEndDate) > new Date()) 
                        ? product.discountPrice 
                        : product.price;

    const totalPieces = quantityCartons * product.colisage;
    const totalPrice = totalPieces * activePrice;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {
          ...item,
          quantityCartons: item.quantityCartons + quantityCartons,
          totalPieces: (item.quantityCartons + quantityCartons) * item.colisage,
          totalPrice: ((item.quantityCartons + quantityCartons) * item.colisage) * activePrice,
          price: activePrice
        } : item);
      }
      return [...prev, { ...product, price: activePrice, quantityCartons, totalPieces, totalPrice }];
    });
    setProductToAdd(null);
    setSearchValue('');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Admin Logic
  const handleAdminLogin = (pin: string) => {
    if (pin === adminPin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setIsAdminOpen(false);
  };

  const handleUpdateProduct = (updated: Product) => {
    const newProducts = products.map(p => p.id === updated.id ? updated : p);
    setProducts(newProducts);
    saveStoredProducts(newProducts);
  };

  const handleAddProduct = (newProduct: Product) => {
    const newProducts = [...products, newProduct];
    setProducts(newProducts);
    saveStoredProducts(newProducts);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
      saveStoredProducts(newProducts);
    }
  };

  // Category Management Logic
  const handleAddCategory = (newCat: string) => {
    if (!customCategories.includes(newCat)) {
      const updated = [...customCategories, newCat];
      setCustomCategories(updated);
      saveStoredCategories(updated);
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    if (!newName.trim()) return;
    
    // 1. Update Products
    const updatedProducts = products.map(p => p.category === oldName ? { ...p, category: newName } : p);
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    // 2. Update Custom Categories List
    const updatedCats = customCategories.map(c => c === oldName ? newName : c);
    if (!customCategories.includes(oldName) && !customCategories.includes(newName)) {
      updatedCats.push(newName);
    }
    setCustomCategories(updatedCats);
    saveStoredCategories(updatedCats);
  };

  const handleDeleteCategory = (catName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف العائلة "${catName}"؟ المنتجات المرتبطة لن تحذف ولكن يفضل تغيير عائلتها.`)) {
       const updatedCats = customCategories.filter(c => c !== catName);
       setCustomCategories(updatedCats);
       saveStoredCategories(updatedCats);
    }
  };

  // PIN Change Logic
  const handlePinChange = (newPin: string) => {
    setAdminPin(newPin);
    saveStoredPin(newPin);
  };

  // Config Update Logic
  const handleUpdateConfig = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  // ====== Filter Logic ======
  const filteredProducts = useMemo(() => {
    let result = products;

    // 🔴 إخفاء المنتجات المخفية عن الزبائن (isHidden)
    // المشرف يراها في لوحة التحكم فقط
    if (!isAuthenticated) {
      result = result.filter(p => !p.isHidden);
    }

    // Search
    if (searchValue) {
      const q = searchValue.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      );
    }

    // Category
    if (selectedCategory === 'DISCOUNTS') {
      const now = new Date();
      result = result.filter(p => p.discountPrice && p.discountEndDate && new Date(p.discountEndDate) > now);
    } else if (selectedCategory !== 'ALL') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sort
    if (sortOption === 'PRICE_ASC') {
      result = [...result].sort((a, b) => {
        const priceA = a.discountPrice || a.price;
        const priceB = b.discountPrice || b.price;
        return priceA - priceB;
      });
    } else if (sortOption === 'PRICE_DESC') {
      result = [...result].sort((a, b) => {
        const priceA = a.discountPrice || a.price;
        const priceB = b.discountPrice || b.price;
        return priceB - priceA;
      });
    } else if (sortOption === 'NAME_ASC') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchValue, selectedCategory, sortOption, isAuthenticated]);

  // Extract Categories
  const allCategories = useMemo(() => {
    const productCats = new Set(products.map(p => p.category));
    customCategories.forEach(c => productCats.add(c));
    return Array.from(productCats).sort();
  }, [products, customCategories]);

  // Re-order logic
  const handleReorder = (items: CartItem[]) => {
    setCart(items);
    setView('CART');
    setIsCartOpen(true);
  };

  // Current Banner Data
  const currentBannerData = useMemo(() => {
    let banner = appConfig.globalBanner;
    let position = appConfig.bannerPositions?.['GLOBAL'] ?? 50;

    if (selectedCategory !== 'ALL' && selectedCategory !== 'DISCOUNTS' && appConfig.categoryBanners?.[selectedCategory]) {
      banner = appConfig.categoryBanners[selectedCategory];
      position = appConfig.bannerPositions?.[selectedCategory] ?? 50;
    }
    
    return { banner, position };
  }, [appConfig, selectedCategory]);

  const bannerTitle = selectedCategory === 'ALL' ? 'الرئيسية' : (selectedCategory === 'DISCOUNTS' ? 'تخفيضات' : selectedCategory);

  return (
    <div className="min-h-screen pb-20 flex flex-col">
      {/* Header */}
      {view !== 'INVOICE' && (
        <Header 
          cartCount={cart.length}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onChangeView={(v) => {
            setView(v);
            setSearchValue('');
            if (v === 'CATALOG') {
               setSelectedCategory('ALL'); 
            }
          }}
          onSearchChange={(e) => setSearchValue(e.target.value)}
          searchValue={searchValue}
          selectedCategory={selectedCategory}
          onOpenFilter={() => setIsFilterOpen(true)}
          sortOption={sortOption}
          onSortChange={setSortOption}
          logoSrc={appConfig.logo}
          onSelectCategory={setSelectedCategory}
          products={products}
          onAddToCart={(p) => setProductToAdd(p)}
          hidePrice={appConfig.hidePrice}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-6 flex-1">
        
        {view === 'CATALOG' && (
          <>
            {/* Banner */}
            <HeroSlider 
              imageSrc={currentBannerData.banner} 
              title={bannerTitle} 
              isSticky={appConfig.stickyBanner}
              verticalPosition={currentBannerData.position}
            />

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={(p) => setProductToAdd(p)}
                  isAdmin={isAuthenticated}
                  onEdit={() => setIsAdminOpen(true)}
                  onViewDetail={(p) => { setSelectedProduct(p); setView('DETAIL'); }}
                  hidePrice={appConfig.hidePrice}
                  priceLabel={appConfig.priceLabel}
                />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                  <p className="text-xl font-bold">لا توجد منتجات تطابق بحثك</p>
                  <p className="text-sm mt-2">جرب البحث بالاسم، الكود، أو الباركود</p>
                  <button onClick={() => {setSearchValue(''); setSelectedCategory('ALL');}} className="mt-4 text-primary-600 underline">إعادة ضبط الفلاتر</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* DETAIL */}
        {view === 'DETAIL' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            relatedProducts={products.filter(p =>
              p.category === selectedProduct.category &&
              p.id !== selectedProduct.id &&
              !p.isHidden
            ).slice(0, 8)}
            onBack={() => setView('CATALOG')}
            onAddToCart={(p) => setProductToAdd(p)}
            onSelectProduct={(p) => setSelectedProduct(p)}
            hidePrice={appConfig.hidePrice}
            priceLabel={appConfig.priceLabel}
          />
        )}

        {view === 'HISTORY' && (
           <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-6">
                <button onClick={resetToCatalog} className="bg-gray-100 p-2 rounded-full"><div className="rotate-180">➜</div></button>
                <h2 className="text-2xl font-bold">طلباتي السابقة</h2>
             </div>
             <div className="space-y-4">
               {orderHistory.map(order => (
                 <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 transition hover:shadow-md">
                   <div className="flex-1">
                     <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-lg">{order.id}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">مكتمل</span>
                     </div>
                     <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString('fr-FR')} - {new Date(order.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
                     <p className="text-sm text-gray-500 mt-1">الزبون: <span className="font-medium text-gray-900 dark:text-gray-200">{order.customerName}</span></p>
                   </div>
                   <div className="text-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg min-w-[150px]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">المبلغ الإجمالي</p>
                      <p className="font-bold text-primary-600 dark:text-primary-400 text-lg">{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(order.totalAmount)}</p>
                   </div>
                   <button 
                    onClick={() => handleReorder(order.items)}
                    className="w-full md:w-auto bg-gray-900 dark:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg"
                   >
                     إعادة الطلب
                   </button>
                 </div>
               ))}
               {orderHistory.length === 0 && (
                 <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">لا يوجد سجل طلبات بعد</p>
                    <button onClick={resetToCatalog} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg">ابدأ التسوق</button>
                 </div>
               )}
             </div>
           </div>
        )}

        {/* STATS */}
        {view === 'STATS' && (
          <StatsView products={products} onBack={resetToCatalog} />
        )}

        {view === 'INVOICE' && (
          <Invoice 
            items={cart} 
            onBack={resetToCatalog} 
            onClearCart={() => {
              setCart([]);
              resetToCatalog();
              setOrderHistory(getStoredOrders());
            }} 
          />
        )}
      </main>

      {/* Footer */}
      {view !== 'INVOICE' && <Footer />}

      {/* Smart Filter Drawer */}
      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={['ALL', ...allCategories]}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        logoSrc={appConfig.logo}
        products={products}
      />

      {/* Cart Modals */}
      <CartModal 
        isOpen={isCartOpen || !!productToAdd}
        productToAdd={productToAdd}
        onClose={() => { setIsCartOpen(false); setProductToAdd(null); }}
        onConfirmAdd={addToCart}
        cartItems={cart}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setView('INVOICE');
        }}
      />

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isAuthenticated={isAuthenticated}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        products={products}
        onUpdateProduct={handleUpdateProduct}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        allCategories={allCategories}
        onRenameCategory={handleRenameCategory}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onChangePin={handlePinChange}
        appConfig={appConfig}
        onUpdateConfig={handleUpdateConfig}
      />

    </div>
  );
}

export default App;
