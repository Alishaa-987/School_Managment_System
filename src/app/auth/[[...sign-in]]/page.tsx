"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginPage = () => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const role = user?.publicMetadata.role;
    if (role) {
      router.push(`/${role}`);
    }
  }, [user, router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-teal-100 via-blue-100 to-indigo-200 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-teal-300 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-100 rounded-full blur-3xl opacity-70 animate-pulse delay-200" />

      {/* Card */}
      <SignIn.Root>
        <SignIn.Step
          name="start"
          className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-10 flex flex-col gap-8 border border-blue-100 animate-fade-in"
        >
          {/* Logo + Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-100 via-teal-100 to-blue-100 shadow-md ring-4 ring-blue-200">
              <Image src="/logo.png" alt="Logo" width={32} height={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-indigo-300 tracking-tight">SchooHub</h1>
            <p className="text-emerald-700 text-sm">Welcome back! Please sign in</p>
          </div>

          {/* Error Message */}
          <Clerk.GlobalError className="text-sm text-red-600 text-center" />

          {/* Username Field */}
          <Clerk.Field name="identifier" className="flex flex-col gap-2">
            <Clerk.Label className="text-sm font-medium text-teal-500">Username</Clerk.Label>
            <Clerk.Input
              type="text"
              required
              className="p-3 rounded-lg border border-blue-200 focus:border-indigo-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all bg-neutral-50"
              placeholder="Enter your username"
            />
            <Clerk.FieldError className="text-xs text-red-400" />
          </Clerk.Field>

          {/* Password Field */}
          <Clerk.Field name="password" className="flex flex-col gap-2">
            <Clerk.Label className="text-sm font-medium text-teal-500">Password</Clerk.Label>
            <Clerk.Input
              type="password"
              required
              className="p-3 rounded-lg border border-blue-200 focus:border-indigo-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all bg-neutral-50"
              placeholder="••••••••"
            />
            <Clerk.FieldError className="text-xs text-red-400" />
          </Clerk.Field>

          {/* Submit Button */}
          <SignIn.Action
            submit
            className="bg-gradient-to-r from-teal-300 via-blue-200 to-indigo-200 hover:opacity-90 transition-all text-indigo-800 font-semibold rounded-lg py-3 shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In
          </SignIn.Action>

          {/* Footer */}
          <div className="text-center text-sm text-blue-500">
            <p>
              Don’t have an account?{" "}
              <a href="/sign-up" className="text-indigo-600 font-semibold hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  );
};

export default LoginPage;
