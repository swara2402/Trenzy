import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SignupPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <h1 className="text-3xl font-bold mb-4">Sign Up</h1>
      <form className="flex flex-col space-y-4 w-80">
        <Input type="text" placeholder="Username" required />
        <Input type="email" placeholder="Email" required />
        <Input type="password" placeholder="Password" required />
        <Button type="submit" className="mt-2">Sign Up</Button>
      </form>
    </div>
  );
};

export default SignupPage;
