"use client";

import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const { checkAuth } = useAuth();

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = useCallback(async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/get-user`
      );
      const userData = response?.data?.data;
      setUserName(userData?.name || "User");
      setUserEmail(userData?.email || "user@example.com");
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setUserName("User");
      setUserEmail("user@example.com");
    }
  }, [checkAuth, router]);

  return (
    <header className="bg-white shadow-md p-5 flex justify-end items-center border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="relative">
              <UserIcon className="h-8 w-8 text-[#036280] rounded-full border-2 border-[#036280] p-1" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>User Info</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span className="font-bold">Name:</span> {userName}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="font-bold">Email:</span> {userEmail}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
