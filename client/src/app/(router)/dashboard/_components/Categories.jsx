"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../../../../../context/AuthContext";

export default function Categories({ onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/category`
      );
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    setCreating(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/category`,
        { name: newCategory }
      );

      setCategories([...categories, response.data.data]);

      onCategoryChange(response.data.data.id);
      setNewCategory("");
    } catch (error) {
      console.error("Failed to create category:", error);
      setError("Failed to create category. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setDeleting(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/category/${categoryId}`
      );
      setCategories(categories.filter((c) => c.id !== categoryId));
      if (selectedCategory === categoryId) {
        setSelectedCategory("");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      setError("Failed to delete category. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirm = () => {
    if (onCategoryChange) {
      onCategoryChange(selectedCategory);
    }
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <AlertDialog open={!!error}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <RadioGroup
              value={selectedCategory}
              onValueChange={handleCategorySelect}
              className="space-y-2"
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between space-x-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={category.id}
                      id={`category-${category.id}`}
                    />
                    <Label htmlFor={`category-${category.id}`}>
                      {category.name}
                    </Label>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={deleting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the category &quot;{category.name}&quot;.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button onClick={handleCreateCategory} disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create
            </Button>
          </div>
          {selectedCategory && (
            <Badge variant="secondary">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </Badge>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={!selectedCategory}>
                Confirm Selection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Selection</DialogTitle>
                <DialogDescription>
                  You have selected the following category:
                </DialogDescription>
              </DialogHeader>
              {selectedCategory && (
                <Badge variant="secondary" className="mt-2">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </Badge>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleConfirm}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
