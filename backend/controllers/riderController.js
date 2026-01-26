import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// Get rider's profile/status
const getRiderProfile = async (req, res) => {
  try {
    const rider = await userModel
      .findById(req.userId)
      .select("-password");

    if (!rider) {
      return res.json({ success: false, message: "Rider not found" });
    }

    res.json({ success: true, rider });
  } catch (error) {
    console.error("Get rider profile error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update rider status (available, busy, offline)
const updateRiderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["available", "busy", "offline"].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const rider = await userModel.findByIdAndUpdate(
      req.userId,
      { riderStatus: status },
      { new: true }
    ).select("-password");

    res.json({ 
      success: true, 
      rider,
      message: `Status updated to ${status}` 
    });
  } catch (error) {
    console.error("Update rider status error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update rider's current location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.json({ success: false, message: "Location required" });
    }

    // Update rider's location
    await userModel.findByIdAndUpdate(req.userId, {
      currentLocation: {
        latitude,
        longitude,
        lastUpdated: new Date(),
      },
    });

    // If rider has an active delivery, update the order's tracking too
    const activeOrder = await orderModel.findOne({
      riderId: req.userId,
      orderStatus: "out_for_delivery",
    });

    if (activeOrder) {
      activeOrder.riderCurrentLocation = {
        latitude,
        longitude,
        lastUpdated: new Date(),
      };
      activeOrder.locationHistory.push({
        latitude,
        longitude,
        timestamp: new Date(),
      });
      await activeOrder.save();
    }

    res.json({ success: true, message: "Location updated" });
  } catch (error) {
    console.error("Update location error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get available orders for pickup (ready_for_pickup status)
const getAvailableOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({
        orderStatus: "ready_for_pickup",
        riderId: null, // Not assigned to any rider
      })
      .populate("userId", "name phone")
      .populate("restaurantId", "restaurantName restaurantAddress")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Get available orders error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get rider's assigned/active orders
const getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { riderId: req.userId };
    
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    const orders = await orderModel
      .find(query)
      .populate("userId", "name phone")
      .populate("restaurantId", "restaurantName restaurantAddress restaurantImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Accept an order for delivery
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const rider = await userModel.findById(req.userId);
    
    // Check if rider is available
    if (rider.riderStatus !== "available") {
      return res.json({ 
        success: false, 
        message: "Please set your status to available first" 
      });
    }

    // Check if rider already has an active delivery
    const activeDelivery = await orderModel.findOne({
      riderId: req.userId,
      orderStatus: "out_for_delivery",
    });

    if (activeDelivery) {
      return res.json({
        success: false,
        message: "You already have an active delivery. Complete it first.",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.riderId) {
      return res.json({ success: false, message: "Order already assigned to another rider" });
    }

    if (order.orderStatus !== "ready_for_pickup") {
      return res.json({ success: false, message: "Order is not ready for pickup" });
    }

    // Assign rider to order
    order.riderId = req.userId;
    order.riderName = rider.name;
    order.riderPhone = rider.phone;
    order.riderAssignedAt = new Date();
    order.riderCurrentLocation = rider.currentLocation;
    
    // Calculate estimated delivery time (rough estimate: 20-30 mins)
    const estimatedMinutes = 25;
    order.estimatedMinutes = estimatedMinutes;
    order.estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    
    await order.save();

    // Update rider status to busy
    rider.riderStatus = "busy";
    await rider.save();

    res.json({ 
      success: true, 
      order,
      message: "Order accepted! Head to the restaurant for pickup." 
    });
  } catch (error) {
    console.error("Accept order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Mark order as picked up (start delivery)
const pickupOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findOne({
      _id: orderId,
      riderId: req.userId,
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== "ready_for_pickup") {
      return res.json({ success: false, message: "Order is not ready for pickup" });
    }

    order.orderStatus = "out_for_delivery";
    order.pickedUpAt = new Date();
    
    // Update estimated delivery time
    const estimatedMinutes = 15;
    order.estimatedMinutes = estimatedMinutes;
    order.estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    
    await order.save();

    res.json({ 
      success: true, 
      order,
      message: "Order picked up! Delivering to customer." 
    });
  } catch (error) {
    console.error("Pickup order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Mark order as delivered
const deliverOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findOne({
      _id: orderId,
      riderId: req.userId,
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== "out_for_delivery") {
      return res.json({ success: false, message: "Order is not out for delivery" });
    }

    order.orderStatus = "delivered";
    order.deliveredAt = new Date();
    order.paymentStatus = order.paymentMethod === "cash" ? "completed" : order.paymentStatus;
    
    await order.save();

    // Update rider stats and status
    const rider = await userModel.findById(req.userId);
    rider.totalDeliveries += 1;
    rider.riderStatus = "available";
    await rider.save();

    res.json({ 
      success: true, 
      order,
      message: "Order delivered successfully!" 
    });
  } catch (error) {
    console.error("Deliver order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get rider stats
const getRiderStats = async (req, res) => {
  try {
    const rider = await userModel.findById(req.userId);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalDeliveries,
      todayDeliveries,
      activeOrders,
      completedOrders,
    ] = await Promise.all([
      orderModel.countDocuments({ 
        riderId: req.userId, 
        orderStatus: "delivered" 
      }),
      orderModel.countDocuments({
        riderId: req.userId,
        orderStatus: "delivered",
        deliveredAt: { $gte: todayStart },
      }),
      orderModel.countDocuments({
        riderId: req.userId,
        orderStatus: { $in: ["ready_for_pickup", "out_for_delivery"] },
      }),
      orderModel.find({
        riderId: req.userId,
        orderStatus: "delivered",
        deliveredAt: { $gte: todayStart },
      }).select("totalAmount"),
    ]);

    const todayEarnings = completedOrders.reduce((sum, order) => {
      // Assume rider earns 80 Rs per delivery
      return sum + 80;
    }, 0);

    res.json({
      success: true,
      stats: {
        totalDeliveries,
        todayDeliveries,
        activeOrders,
        todayEarnings,
        rating: rider.riderRating,
        totalRatings: rider.totalRiderRatings,
      },
    });
  } catch (error) {
    console.error("Get rider stats error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all available riders (for restaurant to assign)
const getAvailableRiders = async (req, res) => {
  try {
    const riders = await userModel
      .find({ 
        role: "rider", 
        riderStatus: "available" 
      })
      .select("name phone vehicleType vehicleNumber riderRating totalDeliveries currentLocation");

    res.json({ success: true, riders });
  } catch (error) {
    console.error("Get available riders error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Restaurant assigns rider to order
const assignRiderToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderId } = req.body;

    const order = await orderModel.findOne({
      _id: orderId,
      restaurantId: req.userId,
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.riderId) {
      return res.json({ success: false, message: "Order already has a rider assigned" });
    }

    const rider = await userModel.findOne({
      _id: riderId,
      role: "rider",
      riderStatus: "available",
    });

    if (!rider) {
      return res.json({ success: false, message: "Rider not available" });
    }

    // Assign rider
    order.riderId = riderId;
    order.riderName = rider.name;
    order.riderPhone = rider.phone;
    order.riderAssignedAt = new Date();
    order.riderCurrentLocation = rider.currentLocation;
    
    // Set estimated delivery time
    const estimatedMinutes = 25;
    order.estimatedMinutes = estimatedMinutes;
    order.estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    
    await order.save();

    // Update rider status
    rider.riderStatus = "busy";
    await rider.save();

    res.json({ 
      success: true, 
      order,
      message: `Rider ${rider.name} assigned to order` 
    });
  } catch (error) {
    console.error("Assign rider error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get order tracking info (for customer)
const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel
      .findById(orderId)
      .populate("riderId", "name phone vehicleType vehicleNumber riderRating currentLocation")
      .populate("restaurantId", "restaurantName restaurantAddress restaurantImage");

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Calculate remaining time
    let remainingMinutes = null;
    if (order.estimatedDeliveryTime) {
      remainingMinutes = Math.max(
        0,
        Math.round((new Date(order.estimatedDeliveryTime) - new Date()) / 60000)
      );
    }

    res.json({
      success: true,
      tracking: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        restaurantName: order.restaurantName,
        restaurantLocation: order.restaurantLocation,
        deliveryAddress: order.deliveryAddress,
        rider: order.riderId ? {
          _id: order.riderId._id,
          name: order.riderId.name,
          phone: order.riderId.phone,
          vehicleType: order.riderId.vehicleType,
          vehicleNumber: order.riderId.vehicleNumber,
          rating: order.riderId.riderRating,
          currentLocation: order.riderCurrentLocation,
        } : null,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        remainingMinutes,
        pickedUpAt: order.pickedUpAt,
        deliveredAt: order.deliveredAt,
        locationHistory: order.locationHistory,
      },
    });
  } catch (error) {
    console.error("Get order tracking error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getRiderProfile,
  updateRiderStatus,
  updateLocation,
  getAvailableOrders,
  getMyOrders,
  acceptOrder,
  pickupOrder,
  deliverOrder,
  getRiderStats,
  getAvailableRiders,
  assignRiderToOrder,
  getOrderTracking,
};
