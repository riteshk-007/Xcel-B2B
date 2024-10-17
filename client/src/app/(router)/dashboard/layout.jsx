import Header from "@/components/header";
import { Sidenav } from "@/components/side-navbar";
import React from "react";

const layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidenav />
      <Header />
      <main className="md:pl-60 pt-4 md:pt-0">
        <div className="container mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default layout;
