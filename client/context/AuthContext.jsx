"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { checkAuthService } from "./checkAuthService";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async () => {
    try {
      const response = await checkAuthService();
      if (response && response.success) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = () => {
    Cookies.remove("accessToken");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = Cookies.get("accessToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
