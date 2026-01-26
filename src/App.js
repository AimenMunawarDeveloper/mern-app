import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantMenu from "./pages/RestaurantMenu";
import RiderDashboard from "./pages/RiderDashboard";
import OrderTracking from "./pages/OrderTracking";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import "../node_modules/bootstrap-dark-5/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <Router>
            <div>
              <Routes>
                {/* Customer Routes */}
                <Route exact path="/" element={<Restaurants />} />
                <Route path="/restaurant/:restaurantId" element={<RestaurantDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/track/:orderId" element={<OrderTracking />} />
                {/* Restaurant Owner Routes */}
                <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
                <Route path="/restaurant/menu" element={<RestaurantMenu />} />
                {/* Rider Routes */}
                <Route path="/rider/dashboard" element={<RiderDashboard />} />
              </Routes>
            </div>
          </Router>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
