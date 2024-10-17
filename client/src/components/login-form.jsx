"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

import { useToast } from "@/hooks/use-toast";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const results = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/login`,
        data
      );
      if (results.status === 200) {
        const accessToken = results?.data?.data;
        Cookies.set("accessToken", accessToken, {
          expires: process.env.ACCESS_TOKEN_LIFE,
        });
        toast({
          title: "Login successful",
          description: "You have been logged in successfully",
          status: "success",
        });

        setLoading(false);
        router.push("/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          status: "error",
        });
        setLoading(false);
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        status: "error",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your details below to login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="p-2">
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                      pattern: {
                        value:
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message:
                          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-6">
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
