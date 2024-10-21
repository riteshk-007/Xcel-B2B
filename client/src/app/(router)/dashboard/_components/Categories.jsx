"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, Edit, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../../../../../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Categories({
  onCategoryChange,
  allowEdit = false,
  allowCreate = false,
  allowDelete = false,
  allowSelect = true,
  initialSelectedCategories = [],
}) {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    initialSelectedCategories
  );
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedName, setEditedName] = useState("");

  const { checkAuth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        window.location.href = "/login";
        return;
      }
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/category`
      );
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    if (categoryId === undefined || categoryId === null) return;

    setSelectedCategories((prev) => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];

      if (onCategoryChange) {
        const selectedCategoryObjects = categories.filter(
          (c) => c && newSelection.includes(c.id)
        );
        onCategoryChange(selectedCategoryObjects);
      }

      return newSelection;
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/category`,
        { name: newCategory }
      );
      const newCategoryData = response.data.data;
      if (newCategoryData && newCategoryData.id) {
        setCategories([...categories, newCategoryData]);
        setNewCategory("");
        toast({
          title: "Category Created",
          description: `Category "${newCategoryData.name}" has been created successfully.`,
        });
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (categoryId === undefined || categoryId === null) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/category/${categoryId}`
      );
      setCategories(categories.filter((c) => c && c.id !== categoryId));
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category) => {
    if (category && category.id) {
      setEditingCategory(category.id);
      setEditedName(category.name || "");
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategory === null) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/category/${editingCategory}`,
        { name: editedName }
      );
      const updatedCategory = response.data.data;
      if (updatedCategory && updatedCategory?.id) {
        setCategories(
          categories.map((c) =>
            c?.id === editingCategory ? updatedCategory : c
          )
        );
        setEditingCategory(null);
        toast({
          title: "Category Updated",
          description: `Category has been updated to "${updatedCategory.name}".`,
        });
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditedName("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            {categories.map((category) => {
              if (!category || !category.id) return null;
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between space-x-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <div className="flex items-center space-x-2 flex-grow">
                    {allowSelect && (
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() =>
                          handleCategorySelect(category.id)
                        }
                        id={`category-${category.id}`}
                      />
                    )}
                    {editingCategory === category.id && allowEdit ? (
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full"
                      />
                    ) : (
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="flex-grow cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {allowEdit &&
                      (editingCategory === category.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUpdateCategory}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ))}
                    {allowDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {allowCreate && (
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={handleCreateCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
          )}
          {allowSelect && selectedCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCategories.map((categoryId) => {
                const category = categories.find(
                  (c) => c && c.id === categoryId
                );
                return (
                  category && (
                    <Badge
                      key={categoryId}
                      variant="secondary"
                      className="text-sm"
                    >
                      {category.name}
                    </Badge>
                  )
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
