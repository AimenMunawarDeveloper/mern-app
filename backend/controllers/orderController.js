import orderModel from "../models/orderModel.js";

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      restaurantId,
      restaurantName,
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.json({ success: false, message: "No items in order" });
    }

    // Validate restaurant
    if (!restaurantId) {
      return res.json({ success: false, message: "Restaurant is required" });
    }

    // Calculate estimated delivery time (30-45 minutes from now)
    const estimatedDeliveryTime = new Date(
      Date.now() + (30 + Math.random() * 15) * 60 * 1000
    );

    const order = await orderModel.create({
      userId: req.userId,
      restaurantId,
      restaurantName,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod: paymentMethod || "cash",
      specialInstructions,
      estimatedDeliveryTime,
      orderStatus: "placed",
      paymentStatus: paymentMethod === "cash" ? "pending" : "completed",
    });

    res.json({
      success: true,
      order,
      message: "Order placed successfully!",
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get single order details
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Only allow cancellation if order is not yet being prepared
    if (!["placed", "confirmed"].includes(order.orderStatus)) {
      return res.json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update order status (for admin/restaurant)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Reorder - get items from a previous order
const reorder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Return items in cart-compatible format
    const cartItems = order.items.map((item) => ({
      id: item.productId,
      name: item.name,
      img: item.img,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

    res.json({ success: true, items: cartItems });
  } catch (error) {
    console.error("Reorder error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ============ RESTAURANT FUNCTIONS ============

// Get all orders for restaurant dashboard (filtered by restaurant)
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Filter orders by the logged-in restaurant
    const query = { restaurantId: req.userId };
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    const orders = await orderModel
      .find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await orderModel.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Accept order (restaurant confirms)
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== "placed") {
      return res.json({
        success: false,
        message: "Order has already been processed",
      });
    }

    order.orderStatus = "confirmed";
    await order.save();

    res.json({
      success: true,
      message: "Order accepted successfully",
      order,
    });
  } catch (error) {
    console.error("Accept order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Reject order
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (!["placed", "confirmed"].includes(order.orderStatus)) {
      return res.json({
        success: false,
        message: "Order cannot be rejected at this stage",
      });
    }

    order.orderStatus = "cancelled";
    order.specialInstructions = order.specialInstructions 
      ? `${order.specialInstructions}\n[Rejected: ${reason || "No reason provided"}]`
      : `[Rejected: ${reason || "No reason provided"}]`;
    await order.save();

    res.json({
      success: true,
      message: "Order rejected",
      order,
    });
  } catch (error) {
    console.error("Reject order error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update order status (restaurant)
const updateStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "placed",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Update payment status if delivered with COD
    if (status === "delivered" && order.paymentMethod === "cash") {
      order.paymentStatus = "completed";
    }

    order.orderStatus = status;
    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get order statistics for dashboard (filtered by restaurant)
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mongoose = await import("mongoose");
    const restaurantId = new mongoose.default.Types.ObjectId(req.userId);

    const stats = await orderModel.aggregate([
      { $match: { restaurantId } },
      {
        $facet: {
          todayOrders: [
            { $match: { createdAt: { $gte: today } } },
            { $count: "count" },
          ],
          todayRevenue: [
            { $match: { createdAt: { $gte: today }, orderStatus: { $ne: "cancelled" } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          pendingOrders: [
            { $match: { orderStatus: "placed" } },
            { $count: "count" },
          ],
          statusCounts: [
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
          ],
          totalOrders: [{ $count: "count" }],
          totalRevenue: [
            { $match: { orderStatus: { $ne: "cancelled" } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
        },
      },
    ]);

    const result = stats[0];

    res.json({
      success: true,
      stats: {
        todayOrders: result.todayOrders[0]?.count || 0,
        todayRevenue: result.todayRevenue[0]?.total || 0,
        pendingOrders: result.pendingOrders[0]?.count || 0,
        totalOrders: result.totalOrders[0]?.count || 0,
        totalRevenue: result.totalRevenue[0]?.total || 0,
        statusCounts: result.statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  reorder,
  // Restaurant functions
  getAllOrders,
  acceptOrder,
  rejectOrder,
  updateStatus,
  getOrderStats,
};
