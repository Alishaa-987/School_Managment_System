import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { routeAccessMap } from './lib/settings';
import { NextResponse } from 'next/server';


const isProtectedRoute = createRouteMatcher(['/admin', '/teacher'])

const matchers = Object.keys(routeAccessMap).map((route)=>({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

console.log(matchers);


export default clerkMiddleware(async (auth, req) => {
  // if (isProtectedRoute(req)) auth().protect()

  const { sessionClaims, userId } = await auth();

  let role = (sessionClaims?.metadata as { role?: string })?.role;

  // If no role in metadata, try to determine from database
  if (!role && userId) {
    try {
      // Import prisma here to avoid issues
      const { prisma } = await import('./lib/prisma');

      // Check all tables in parallel
      const [admin, teacher, student, parent] = await Promise.all([
        prisma.admin.findUnique({ where: { id: userId } }).catch(() => null),
        prisma.teacher.findUnique({ where: { id: userId } }).catch(() => null),
        prisma.student.findUnique({ where: { id: userId } }).catch(() => null),
        prisma.parent.findUnique({ where: { id: userId } }).catch(() => null),
      ]);

      if (admin) role = 'admin';
      else if (teacher) role = 'teacher';
      else if (student) role = 'student';
      else if (parent) role = 'parent'; // Role name
      else role = 'admin'; // Default fallback
    } catch (error) {
      console.error('Database error in middleware:', error);
      role = 'admin'; // Default fallback on DB error
    }
  }

  // Map role to route
  const roleToRoute = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
    parent: '/parents' // Parent role maps to /parents route
  };

  const route = roleToRoute[role as keyof typeof roleToRoute] || '/admin';

  // If user is signed in and on home page, redirect to their dashboard
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL(route, req.url));
  }

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role!)) {
      return NextResponse.redirect(new URL(route, req.url));
    }
  }
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};