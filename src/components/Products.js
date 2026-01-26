import React from "react";
import Card from "../components/Card";

const Products = ({ products }) => {
  return (
    <div className="my-5 d-flex flex-wrap justify-content-around gap-4">
      {products.map((product, index) => (
        <Card
          key={product._id || index}
          productId={product._id}
          categoryName={product.CategoryName}
          name={product.name}
          img={product.img}
          options={product.options || []}
          description={product.description}
        />
      ))}
    </div>
  );
};

export default Products;
