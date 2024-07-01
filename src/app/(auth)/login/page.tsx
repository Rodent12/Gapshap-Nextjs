"use client";

import Button from "@/components/ui/Button";
import { FC, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import Image from "next/image";

const Page: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function loginWithGoogle() {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      toast.error("Something went wrong with your login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-100 flex items-center justify-center ">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl mx-auto">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-center text-4xl font-semibold mt-4 mb-4">Sign into Gapshap</h1>
            <Image src="/comm.png" alt="Logo" width={360} height={360} />
          </div>
            <Button
              isLoading={isLoading}
              type="button"
              className="w-full p-2 bg-blue-500 hover:bg-blue-700 text-white rounded-md"
              onClick={loginWithGoogle}
            >
              {isLoading? "Logging in..." : "Continue with google"}
            </Button>
        </div>
      </div>
    </>
  );
};

export default Page;
