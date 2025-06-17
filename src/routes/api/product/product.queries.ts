import { useQuery } from "@tanstack/react-query";
import { getAllProducts, getProductById } from "./product.api";

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: getAllProducts });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
