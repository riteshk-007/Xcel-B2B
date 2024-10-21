"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SearchComponent } from "../_components/SearchInput";
import RenderSearchResultCard from "./_components/renderSearchResultCard";
import RenderProductCard from "./_components/renderProductCard";

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  const { checkAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/product?page=${currentPage}&limit=${ITEMS_PER_PAGE}`
      );

      setProducts(response.data.data.products);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products");
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, checkAuth, router, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (slug) => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/product/${slug}`);
      setProducts(products.filter((product) => product.slug !== slug));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/dashboard/products/add-product">Add Product</Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Product List</CardTitle>

          <div className="w-full md:w-2/3">
            <SearchComponent
              apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/product/search`}
              renderCard={(product) => (
                <RenderSearchResultCard
                  product={product}
                  handleDelete={handleDelete}
                />
              )}
              placeholder="Search by product name"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-20 w-full bg-gray-300" />
              ))}
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-center py-4">No products found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Image</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Slug
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, indx) => (
                      <RenderProductCard
                        product={product}
                        handleDelete={handleDelete}
                        key={indx}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, products.length)} of{" "}
                    {products.length} results
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
