import { IProductModel } from "./product";

export class CProductModel implements IProductModel {
  id: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
  indianPrice: number;

  constructor(
    id: string,
    name: string,
    price: number,
    description: string,
    inStock: boolean
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.description = description;
    this.inStock = inStock;
    this.indianPrice = this.getIndianPrice(83);
  }

  // Method to convert price to Indian Rupees
  private getIndianPrice(conversionRate: number): number {
    return this.price * conversionRate;
  }
}
