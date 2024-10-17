"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, IndianRupee, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import Categories from "./Categories";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../../../../../context/AuthContext";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function AddProductPage() {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quillLoaded, setQuillLoaded] = useState(false);
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loadQuill = async () => {
      await import("react-quill/dist/quill.snow.css");
      setQuillLoaded(true);
    };
    loadQuill();
    checkAuth();
  }, [checkAuth]);

  const onDrop = (acceptedFiles) => {
    setImage(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: false,
  });

  const handleCategoryChange = (selectedCategory) => {
    setCategory(selectedCategory);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/login");
      return;
    }

    if (!productName || !price || !description || !category || !image) {
      toast({
        title: "Error",
        description:
          "Please fill in all fields, select a category, and upload an image.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", productName);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("categoryId", category);
    formData.append("image", image);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/product`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.status === 201) {
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        router.push("/dashboard/products");
      } else {
        throw new Error("Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Add Product</CardTitle>
            <Button disabled={loading} type="submit">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {loading ? "Publishing..." : "Publish"}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
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
                    className="w-full"
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
                      className="pl-10 w-full"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  {quillLoaded ? (
                    <ReactQuill
                      theme="snow"
                      value={description}
                      onChange={setDescription}
                      className="h-64 mb-12"
                    />
                  ) : (
                    <Skeleton className="h-64 w-full" />
                  )}
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
                      {image ? (
                        <Image
                          width={200}
                          height={200}
                          src={URL.createObjectURL(image)}
                          alt="Thumbnail"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                      ) : (
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
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
                  <Categories onCategoryChange={handleCategoryChange} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
