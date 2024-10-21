"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, IndianRupee, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

import dynamic from "next/dynamic";
import { useAuth } from "../../../../../../context/AuthContext";
import Categories from "../../_components/Categories";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function EditProductPage({ params }) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const isAuth = await checkAuth();
        if (!isAuth) {
          router.push("/login");
          return;
        }
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/product/${params.slug}`
        );

        const productData = response.data.data;
        setProductName(productData.title);
        setPrice(productData.price.toString());
        setDescription(productData.description);
        setImagePreview(
          `${process.env.NEXT_PUBLIC_IMAGE_URL}/${productData.image}`
        );
        setSelectedCategories(productData.categories.map((c) => c.categoryId));
      } catch (error) {
        console.error("Failed to load product data:", error);
        setError("Failed to load product data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
    import("react-quill/dist/quill.snow.css");
  }, [params.slug, checkAuth, router]);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: false,
  });

  const handleCategoryChange = (selectedIds) => {
    if (selectedIds === undefined || selectedIds === null) return;
    setSelectedCategories(selectedIds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/login");
      return;
    }

    if (
      !productName ||
      !price ||
      !description ||
      selectedCategories.length === 0
    ) {
      toast({
        title: "Error",
        description:
          "Please fill in all fields and select at least one category.",
        variant: "destructive",
      });
      setUpdating(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", productName);
    formData.append("price", price);
    formData.append("description", description);
    selectedCategories.forEach((categoryId) => {
      formData.append("categoryIds", categoryId);
    });
    if (image) {
      formData.append("image", image);
    }
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/product/${params.slug}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        router.push("/dashboard/products");
      } else {
        throw new Error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product. Please try again.");
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-32 rounded-lg" />
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p>{error}</p>
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/products")}
            >
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Edit Product</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button type="submit" form="edit-product-form" disabled={updating}>
              {updating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {updating ? "Updating..." : "Update"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form id="edit-product-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      className="pl-10"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    className="h-64 mb-12"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Thumbnail Image</Label>
                  <div
                    {...getRootProps()}
                    className={`mt-2 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 transition-colors ${
                      isDragActive ? "border-primary" : "hover:border-gray-400"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="text-center">
                      {imagePreview ? (
                        <Image
                          width={200}
                          height={200}
                          src={imagePreview}
                          alt="Thumbnail"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                      ) : (
                        <Upload className="mx-auto h-12 w-12 text-gray-300" />
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        {isDragActive
                          ? "Drop the image here"
                          : "Drag 'n' drop an image here, or click to select one"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Categories
                    onCategoryChange={handleCategoryChange}
                    allowSelect={true}
                    initialSelectedCategories={selectedCategories}
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
