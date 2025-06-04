import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  console.log("GET request for product with ID:", id);

  // Mock product data
  const product = {
    id,
    name: "Mock Product",
    price: 99.99,
    description: "This is a mock product for testing purposes.",
    inStock: true,
  };

  return NextResponse.json(product);
}
