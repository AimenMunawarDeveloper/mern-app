import React from "react";

export default function Footer() {
  return (
    <footer className="bg-success text-white w-100 py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-3 mb-md-0">
            <h5 className="fw-bold">FoodHub</h5>
            <p className="small mb-0">
              Delivering happiness to your doorstep. Order from the best restaurants in Pakistan!
            </p>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <h6 className="fw-bold">Quick Links</h6>
            <ul className="list-unstyled small mb-0">
              <li><a href="/" className="text-white text-decoration-none">Home</a></li>
              <li><a href="/orders" className="text-white text-decoration-none">My Orders</a></li>
              <li><a href="/profile" className="text-white text-decoration-none">Profile</a></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6 className="fw-bold">Contact</h6>
            <p className="small mb-0">
              Email: support@foodhub.pk<br />
              Phone: +92 300 1234567<br />
              Pakistan
            </p>
          </div>
        </div>
        <hr className="my-3 border-light" />
        <div className="text-center small">
          © 2024 FoodHub Pakistan. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
