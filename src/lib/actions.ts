"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import {
  StudentsSchema,
  TeacherSchema,
  classSchema,
  Subjectschema,
  ExamSchema,
  ParentSchema,
  LessonSchema,
  AssignmentSchema,
} from "./FormValidationSchema";
import { clerkClient } from "@clerk/nextjs/server";
import { UserSex } from "@prisma/client";
import { id } from "zod/locales";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: Subjectschema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: Subjectschema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    // Start a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete related records first to avoid foreign key constraint errors
      await tx.assignment.deleteMany({
        where: { subjectId: Number(id) },
      });

      await tx.lesson.deleteMany({
        where: { subjectId: Number(id) },
      });

      // Remove subject from all teachers (many-to-many relationship)
      await tx.subject.update({
        where: { id: Number(id) },
        data: {
          teachers: {
            set: []
          }
        }
      });

      // Finally delete the subject
      await tx.subject.delete({
        where: {
          id: Number(id),
        },
      });
    });

    console.log("Subject deleted successfully");
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteSubject error:", err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentsSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

   const Client = await clerkClient();

    const user = await Client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      ...(data.email ? { emailAddress: [data.email] } : {}),
      publicMetadata: { role: "student" },
      unsafeMetadata: { dbId: "pending" },
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        ...(data.sex ? { sex: data.sex.toUpperCase() as UserSex } : {}),
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId ? data.parentId : null,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentsSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    // Update Clerk user only if password is provided
    if (data.password && data.password !== "") {
      try {
        const Client = await clerkClient();
        await Client.users.updateUser(data.id, {
          username: data.username,
          password: data.password,
          firstName: data.name,
          lastName: data.surname,
        });
      } catch (clerkErr) {
        console.warn("Clerk user update failed, but continuing with DB update:", clerkErr);
      }
    }

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        ...(data.sex && { sex: data.sex.toUpperCase() as UserSex }),
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId ? data.parentId : null,
      },
    });

    // revalidatePath("/list/students");
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateStudent error:", err);
    return { success: false, error: true };
  }
};
export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    // Delete related records first
    await prisma.attendance.deleteMany({
      where: { studentId: id },
    });

    await prisma.result.deleteMany({
      where: { studentId: id },
    });

    // Try to delete from Clerk first
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(id);
      console.log("Clerk user deleted");
    } catch (clerkErr) {
      console.warn(
        "Clerk user deletion failed, but continuing with DB deletion:",
        clerkErr
      );
    }

    await prisma.student.delete({
      where: {
        id,
      },
    });

    console.log("Student deleted successfully");
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteStudent error:", err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
       const Client = await clerkClient();
         const user = await Client.users.createUser({
           username: data.username,
           password: data.password,
           firstName: data.name,
           lastName: data.surname,
           ...(data.email ? { emailAddress: [data.email] } : {}),
           publicMetadata: { role: "teacher" },
           unsafeMetadata: { dbId: "pending" },
         });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex ? (data.sex.toUpperCase() as UserSex) : "MALE",
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })) || [],
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
   console.log(err);
   if (err && typeof err === 'object' && 'errors' in err) {
     console.log('Clerk errors:', (err as any).errors);
   }
   return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    if (!data.id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: data.id },
    });

    if (!existingTeacher) {
      console.error("Parent not found with id:", data.id);
      return { success: false, error: true };
    }

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        bloodType: data.bloodType,
        ...(data.sex ? { sex: data.sex === "Male" ? "MALE" : "FEMALE" } : {}),
        birthday: data.birthday,
        img: data.img || null,
        subjects: {
          set:
            data.subjects?.map((subjectId) => ({ id: parseInt(subjectId) })) ||
            [],
        },
      },
    });

    // Try to update Clerk user if password is provided
    if (data.password && data.password !== "") {
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUser(data.id, {
          username: data.username,
          password: data.password,
          firstName: data.name,
          lastName: data.surname,
        });
      } catch (clerkErr) {
        console.warn(
          "Clerk user update failed, but teacher was updated in DB:",
          clerkErr
        );
      }
    }

    console.log("Teacher updated successfully");
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateTeacher error:", err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;
    console.log("Deleting teacher with id:", id);

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    // Start a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Disconnect teacher from all subjects (many-to-many relationship)
      const subjectsWithTeacher = await tx.subject.findMany({
        where: {
          teachers: {
            some: { id }
          }
        }
      });
      for (const subject of subjectsWithTeacher) {
        await tx.subject.update({
          where: { id: subject.id },
          data: {
            teachers: {
              disconnect: { id }
            }
          }
        });
      }

      // Set supervisorId to null in classes where this teacher is supervisor
      await tx.class.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null }
      });

      // Delete related lessons first (this will cascade to exams, assignments, attendance)
      await tx.lesson.deleteMany({
        where: { teacherId: id },
      });

      // Finally delete the teacher
      await tx.teacher.delete({
        where: { id },
      });
    }, { timeout: 10000 });

    // Try to delete from Clerk after successful DB deletion
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(id);
      console.log("Clerk user deleted");
    } catch (clerkErr) {
      console.warn(
        "Clerk user deletion failed, but teacher was deleted from DB:",
        clerkErr
      );
    }

    console.log("Teacher deleted successfully");
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteTeacher error:", err);
    return { success: false, error: true };
  }
};


export const createParent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as ParentSchema;
  try {
    await prisma.parent.create({
      data: {
        id: crypto.randomUUID(),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        students: {
          connect: data.studentIds?.map((id) => ({
            id: id,
          })) || []
        },
      },
    });

    // revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
   console.log(err);
   if (err && typeof err === 'object' && 'errors' in err) {
     console.log('Clerk errors:', (err as any).errors);
   }
   return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as ParentSchema;
  try {
    if (!data.id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingParent = await prisma.parent.findUnique({
      where: { id: data.id },
    });

    if (!existingParent) {
      console.error("Parent not found with id:", data.id);
      return { success: false, error: true };
    }

    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        students: {
          set: data.studentIds?.map((id) => ({ id })) || [],
        },
      },
    });

    console.log("Parent updated successfully");
    // revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateParent error:", err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    // Delete the parent directly - students can exist without parents
    await prisma.parent.delete({
      where: {
        id,
      },
    });

    console.log("Parent deleted successfully");
    // revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteParent error:", err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingClass = await prisma.class.findUnique({
      where: { id: Number(id) },
    });

    if (!existingClass) {
      console.error("Class not found with id:", id);
      return { success: false, error: true };
    }

    // Delete related records first to avoid foreign key constraint errors
    await prisma.lesson.deleteMany({
      where: { classId: Number(id) },
    });

    await prisma.student.updateMany({
      where: { classId: Number(id) },
      data: { classId: 1 }, // Move students to a default class
    });

    await prisma.announcement.deleteMany({
      where: { classId: Number(id) },
    });

    await prisma.event.deleteMany({
      where: { classId: Number(id) },
    });

    await prisma.class.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Class deleted successfully");
    // revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteClass error:", err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    console.log("Creating exam with data:", data);

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: new Date(data.startTime), // ✅ convert string → Date
        endTime: new Date(data.endTime), // ✅ convert string → Date
        lessonId: Number(data.lessonId),
      },
    });

    console.log("Exam created successfully");
    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.error("createExam error:", err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    console.log("Updating exam with data:", data);
    console.log("Exam id:", data.id);

    if (!data.id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        lessonId: data.lessonId,
      },
    });

    console.log("Exam updated successfully");
    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateExam error:", err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingExam = await prisma.exam.findUnique({
      where: { id: Number(id) },
    });

    if (!existingExam) {
      console.error("Exam not found with id:", id);
      return { success: false, error: true };
    }

    await prisma.exam.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Exam deleted successfully");
    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteExam error:", err);
    return { success: false, error: true };
  }
};


export const createAssignment = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as AssignmentSchema;
  try {
    console.log("Creating assignment with data:", data);

    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: new Date(data.startDate || Date.now()),
        dueDate: new Date(data.dueDate), // ✅ convert string → Date
        subjectId: Number(data.subjectId),
        lessonId: 1, // Temporary lessonId
      },
    });

    console.log("Assignment created successfully");
    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.error("createAssignment error:", err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as AssignmentSchema;
  try {
    console.log("Updating assignment with data:", data);
    console.log("Assignment id:", data.id);

    if (!data.id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    await prisma.assignment.update({
      where: {
        id: Number(data.id),
      },
      data: {
        title: data.title,
        startDate: new Date(data.startDate || Date.now()),
        dueDate: new Date(data.dueDate),
        subjectId: Number(data.subjectId) || 1,
        lessonId: 1, // Temporary lessonId
      },
    });

    console.log("Assignment updated successfully");
    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateAssignment error:", err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: Number(id) },
    });

    if (!existingAssignment) {
      console.error("Assignment not found with id:", id);
      return { success: false, error: true };
    }

    await prisma.assignment.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Assignment deleted successfully");
    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteAssignment error:", err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingResult = await prisma.result.findUnique({
      where: { id: Number(id) },
    });

    if (!existingResult) {
      console.error("Result not found with id:", id);
      return { success: false, error: true };
    }

    await prisma.result.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Result deleted successfully");
    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteResult error:", err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: Number(id) },
    });

    if (!existingAttendance) {
      console.error("Attendance not found with id:", id);
      return { success: false, error: true };
    }

    await prisma.attendance.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Attendance deleted successfully");
    revalidatePath("/list/attendances");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteAttendance error:", err);
    return { success: false, error: true };
  }
};

export const createEvent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const classId = formData.get("classId") as string;

    if (!title || !description || !startTime || !endTime) {
      return { success: false, error: true, message: "Title, description, start time, and end time are required." };
    }

    // Get current user role and ID
    const role = await getRole();
    const currentUserId = await getCurrentUserId();

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return { success: false, error: true, message: "End time must be after start time." };
    }

    if (start < new Date()) {
      return { success: false, error: true, message: "Start time cannot be in the past." };
    }

    // Validate class if provided
    let classIdNum: number | null = null;
    if (classId) {
      classIdNum = parseInt(classId);
      const classItem = await prisma.class.findUnique({
        where: { id: classIdNum }
      });

      if (!classItem) {
        return { success: false, error: true, message: "Selected class does not exist." };
      }

      // Role-based validation: teachers can only create events for their classes
      if (role === "teacher" && currentUserId) {
        const teacherClasses = await prisma.lesson.findMany({
          where: { teacherId: currentUserId },
          select: { classId: true }
        });
        const teacherClassIds = teacherClasses.map(l => l.classId);
        if (!teacherClassIds.includes(classIdNum)) {
          return { success: false, error: true, message: "You can only create events for classes you teach." };
        }
      }
    }

    await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        startTime: start,
        endTime: end,
        classId: classIdNum,
      },
    });

    console.log("Event created successfully");
    // revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createEvent error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "An event with this title and time already exists." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const classId = formData.get("classId") as string;

    if (!id) {
      return { success: false, error: true, message: "Event ID is required for update." };
    }

    if (!title || !description || !startTime || !endTime) {
      return { success: false, error: true, message: "Title, description, start time, and end time are required." };
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: Number(id) }
    });

    if (!existingEvent) {
      return { success: false, error: true, message: "Event not found. The event may have been deleted." };
    }

    // Get current user role and ID
    const role = await getRole();
    const currentUserId = await getCurrentUserId();

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return { success: false, error: true, message: "End time must be after start time." };
    }

    // Validate class if provided
    let classIdNum: number | null = null;
    if (classId) {
      classIdNum = parseInt(classId);
      const classItem = await prisma.class.findUnique({
        where: { id: classIdNum }
      });

      if (!classItem) {
        return { success: false, error: true, message: "Selected class does not exist." };
      }

      // Role-based validation: teachers can only update events for their classes
      if (role === "teacher" && currentUserId) {
        const teacherClasses = await prisma.lesson.findMany({
          where: { teacherId: currentUserId },
          select: { classId: true }
        });
        const teacherClassIds = teacherClasses.map(l => l.classId);
        if (!teacherClassIds.includes(classIdNum)) {
          return { success: false, error: true, message: "You can only update events for classes you teach." };
        }
      }
    }

    await prisma.event.update({
      where: {
        id: Number(id),
      },
      data: {
        title: title.trim(),
        description: description.trim(),
        startTime: start,
        endTime: end,
        classId: classIdNum,
      },
    });

    console.log("Event updated successfully");
    // revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateEvent error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "An event with this title and time already exists." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true, message: "Event ID is required for deletion." };
    }

    // Get current user role and ID
    const role = await getRole();
    const currentUserId = await getCurrentUserId();

    const existingEvent = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: { class: true }
    });

    if (!existingEvent) {
      return { success: false, error: true, message: "Event not found. The event may have been deleted." };
    }

    // Role-based validation: teachers can only delete events for their classes
    if (role === "teacher" && currentUserId && existingEvent.classId) {
      const teacherClasses = await prisma.lesson.findMany({
        where: { teacherId: currentUserId },
        select: { classId: true }
      });
      const teacherClassIds = teacherClasses.map(l => l.classId);
      if (!teacherClassIds.includes(existingEvent.classId)) {
        return { success: false, error: true, message: "You can only delete events for classes you teach." };
      }
    }

    await prisma.event.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Event deleted successfully");
    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteEvent error:", err);
    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const createAnnouncement = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const classId = formData.get("classId") as string;

    if (!title || !description || !date) {
      return { success: false, error: true, message: "Title, description, and date are required." };
    }

    // Get current user role and ID
    const role = await getRole();
    const currentUserId = await getCurrentUserId();

    // Validate class if provided
    let classIdNum: number | null = null;
    if (classId) {
      classIdNum = parseInt(classId);
      const classItem = await prisma.class.findUnique({
        where: { id: classIdNum }
      });

      if (!classItem) {
        return { success: false, error: true, message: "Selected class does not exist." };
      }

      // Role-based validation: teachers can only create announcements for their classes
      if (role === "teacher" && currentUserId) {
        const teacherClasses = await prisma.lesson.findMany({
          where: { teacherId: currentUserId },
          select: { classId: true }
        });
        const teacherClassIds = teacherClasses.map(l => l.classId);
        if (!teacherClassIds.includes(classIdNum)) {
          return { success: false, error: true, message: "You can only create announcements for classes you teach." };
        }
      }
    }

    await prisma.announcement.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        date: new Date(date),
        classId: classIdNum,
      },
    });

    console.log("Announcement created successfully");
    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createAnnouncement error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "An announcement with this title and date already exists." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const classId = formData.get("classId") as string;

    if (!id) {
      return { success: false, error: true, message: "Announcement ID is required for update." };
    }

    if (!title || !description || !date) {
      return { success: false, error: true, message: "Title, description, and date are required." };
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: Number(id) }
    });

    if (!existingAnnouncement) {
      return { success: false, error: true, message: "Announcement not found. The announcement may have been deleted." };
    }

    // Get current user role and ID
    const role = await getRole();
    const currentUserId = await getCurrentUserId();

    // Validate class if provided
    let classIdNum: number | null = null;
    if (classId) {
      classIdNum = parseInt(classId);
      const classItem = await prisma.class.findUnique({
        where: { id: classIdNum }
      });

      if (!classItem) {
        return { success: false, error: true, message: "Selected class does not exist." };
      }

      // Role-based validation: teachers can only update announcements for their classes
      if (role === "teacher" && currentUserId) {
        const teacherClasses = await prisma.lesson.findMany({
          where: { teacherId: currentUserId },
          select: { classId: true }
        });
        const teacherClassIds = teacherClasses.map(l => l.classId);
        if (!teacherClassIds.includes(classIdNum)) {
          return { success: false, error: true, message: "You can only update announcements for classes you teach." };
        }
      }
    }

    await prisma.announcement.update({
      where: {
        id: Number(id),
      },
      data: {
        title: title.trim(),
        description: description.trim(),
        date: new Date(date),
        classId: classIdNum,
      },
    });

    console.log("Announcement updated successfully");
    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateAnnouncement error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "An announcement with this title and date already exists." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true, message: "Announcement ID is required for deletion." };
    }

    // Get current user role and ID
    const role = await getRole();
    const currentUserId = await getCurrentUserId();

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: Number(id) },
      include: { class: true }
    });

    if (!existingAnnouncement) {
      return { success: false, error: true, message: "Announcement not found. The announcement may have already been deleted." };
    }

    // Role-based validation: teachers can only delete announcements for their classes
    if (role === "teacher" && currentUserId && existingAnnouncement.classId) {
      const teacherClasses = await prisma.lesson.findMany({
        where: { teacherId: currentUserId },
        select: { classId: true }
      });
      const teacherClassIds = teacherClasses.map(l => l.classId);
      if (!teacherClassIds.includes(existingAnnouncement.classId)) {
        return { success: false, error: true, message: "You can only delete announcements for classes you teach." };
      }
    }

    await prisma.announcement.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Announcement deleted successfully");
    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteAnnouncement error:", err);
    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as LessonSchema;
  try {
    console.log("Creating lesson with data:", data);

    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: new Date(data.startTime), // ✅ convert string → Date
        endTime: new Date(data.endTime),
        subjectId: Number(data.subjectId),
        classId: Number(data.classId),
        teacherId: data.teacherId,
      },
    });

    console.log("Lesson created successfully");
    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("createLesson error:", err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as LessonSchema;
  try {
    console.log("Updating lesson with data:", data);
    console.log("lesson id:", data.id);

    if (!data.id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    await prisma.lesson.update({
      where: {
        id: Number(data.id),
      },
      data: {
        name: data.name,
        day: data.day,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        subjectId: Number(data.subjectId),
        classId: Number(data.classId),
        teacherId: data.teacherId,
      },
    });

    console.log("Lesson updated successfully");
    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateLesson error:", err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingLesson = await prisma.lesson.findUnique({
      where: { id: Number(id) },
    });

    if (!existingLesson) {
      console.error("Lesson not found with id:", id);
      return { success: false, error: true };
    }

    // Delete related records first to avoid foreign key constraint errors
    await prisma.attendance.deleteMany({
      where: { lessonId: Number(id) },
    });

    await prisma.exam.deleteMany({
      where: { lessonId: Number(id) },
    });

    await prisma.assignment.deleteMany({
      where: { lessonId: Number(id) },
    });

    await prisma.lesson.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Lesson deleted successfully");
    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("deleteLesson error:", err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const name = formData.get("name") as string;
    const capacity = formData.get("capacity") as string;
    const gradeId = formData.get("gradeId") as string;
    const supervisorId = formData.get("supervisorId") as string;

    await prisma.class.create({
      data: {
        name,
        capacity: parseInt(capacity),
        gradeId: parseInt(gradeId),
        supervisorId: supervisorId || null,
      },
    });

    // revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const capacity = formData.get("capacity") as string;
    const gradeId = formData.get("gradeId") as string;
    const supervisorId = formData.get("supervisorId") as string;

    console.log(
      "updateClass called with id:",
      id,
      "name:",
      name,
      "capacity:",
      capacity,
      "gradeId:",
      gradeId,
      "supervisorId:",
      supervisorId
    );

    if (!id) {
      console.error("id is undefined or null");
      return { success: false, error: true };
    }

    const existingClass = await prisma.class.findUnique({
      where: { id: Number(id) },
    });

    if (!existingClass) {
      console.error("Class not found with id:", id);
      return { success: false, error: true };
    }

    await prisma.class.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        capacity: parseInt(capacity),
        gradeId: parseInt(gradeId),
        supervisorId: supervisorId || null,
      },
    });

    console.log("Class updated successfully");
    // revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateClass error:", err);
    return { success: false, error: true };
  }
};
