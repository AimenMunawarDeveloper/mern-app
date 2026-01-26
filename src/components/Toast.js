import React, { useEffect } from "react";

export default function Toast({ show, message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const bgClass = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  }[type] || "bg-success";

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999, marginTop: "70px" }}
    >
      <div
        className={`toast show ${bgClass} text-white`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-body d-flex justify-content-between align-items-center">
          <span>{message}</span>
          <button
            type="button"
            className="btn-close btn-close-white ms-2"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>
      </div>
    </div>
  );
}
