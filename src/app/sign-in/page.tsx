"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const LoginPage = () => {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-teal-100 via-blue-100 to-indigo-200 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-teal-300 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-100 rounded-full blur-3xl opacity-70 animate-pulse delay-200" />

        <div id="clerk-captcha"></div>

        <SignIn.Root>
          <SignIn.Step
            name="start"
            className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-10 flex flex-col gap-8 border border-blue-100 animate-fade-in"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-100 via-teal-100 to-blue-100 shadow-md ring-4 ring-blue-200">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
              </div>
              <h1 className="text-3xl font-extrabold text-indigo-300 tracking-tight">SchoolHub</h1>
              <p className="text-emerald-700 text-sm">Welcome back! Please sign in</p>
            </div>

            <Clerk.GlobalError className="text-sm text-red-600 text-center" />

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

            <SignIn.Action
              submit
              className="bg-gradient-to-r from-teal-300 via-blue-200 to-indigo-200 hover:opacity-90 transition-all text-indigo-800 font-semibold rounded-lg py-3 shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </SignIn.Action>

            <div className="text-center text-sm text-blue-500">
              <p>Contact administrator for account access</p>
            </div>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </Suspense>
  );
};

export default LoginPage;
