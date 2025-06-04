'use client'
import { useProduct } from "./routes/api/products/product.queries";

export default function Home() {

  const { data, isLoading, error } = useProduct("2"); // Example usage of the product query

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error loading product: {error.message}</div>;
  }
  if (!data) {
    return <div>No product found</div>;
  }

  if (data) {
    console.log("Product data:", data); // Log the product data to the console for debugging
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="text-4xl font-bold mb-4">{data.name}</h1>
        <p className="text-lg mb-2">Price: ${data.price.toFixed(2)}</p>
        <p className="text-md">{data.description}</p>
        <p className="text-md mt-2">Indian Price : {data.indianPrice}</p>
        <p className="text-sm text-gray-500">
          {data.inStock ? "In Stock" : "Out of Stock"}
        </p>
      </main>
    );
  }

}
