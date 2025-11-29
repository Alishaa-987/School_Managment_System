import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RedirectPage() {
  const { userId } = await auth();

  console.log("Redirect page - userId:", userId);

  if (!userId) {
    console.log("No userId, redirecting to /");
    redirect("/");
  }

  // Determine role from database
  let role = "admin"; // default

  try {
    console.log("Checking database for user:", userId);

    // Check all tables in parallel for better performance
    const [admin, teacher, student, parent] = await Promise.all([
      prisma.admin.findUnique({ where: { id: userId } }).catch(() => null),
      prisma.teacher.findUnique({ where: { id: userId } }).catch(() => null),
      prisma.student.findUnique({ where: { id: userId } }).catch(() => null),
      prisma.parent.findUnique({ where: { id: userId } }).catch(() => null),
    ]);

    if (admin) {
      role = "admin";
      console.log("Found admin role");
    } else if (teacher) {
      role = "teacher";
      console.log("Found teacher role");
    } else if (student) {
      role = "student";
      console.log("Found student role");
    } else if (parent) {
      role = "parent"; // Role name
      console.log("Found parent role");
    } else {
      console.log("User not found in any table, using default admin");
    }
  } catch (error) {
    console.error("Database error in redirect:", error);
    // Keep default role as admin
  }

  // Map role to route
  const roleToRoute = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
    parent: '/parents' // Parent role maps to /parents route
  };

  const route = roleToRoute[role as keyof typeof roleToRoute] || '/admin';

  console.log("Redirecting to:", route);
  redirect(route);
}