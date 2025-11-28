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
  ResultSchema,
} from "./FormValidationSchema";
import { clerkClient } from "@clerk/nextjs/server";
import { UserSex } from "@prisma/client";
import { id } from "zod/locales";
import { getRole, getCurrentUserId } from "./utils";

type CurrentState = { success: boolean; error: boolean; message?: string };

const getUserFriendlyError = (err: any): string => {
  const message = err.message || '';

  if (message.includes('Unique constraint failed')) {
    return 'This information is already in use. Please choose a different username or email.';
  }

  if (message.includes('Foreign key constraint failed')) {
    return 'Cannot perform this action because related data is missing or invalid.';
  }

  if (message.includes('timeout')) {
    return 'The operation took too long. Please try again.';
  }

  if (err.code === 'P2002') {
    return 'This record already exists. Please check for duplicates.';
  }

  if (err.code === 'P2025') {
    return 'The item you are trying to update or delete was not found.';
  }

  if (err.code === 'P2003') {
    return 'This action cannot be completed because other records depend on it.';
  }

  // For Clerk errors
  if (message.includes('Clerk')) {
    return 'There was an issue with user account creation. Please check the provided information.';
  }

  // Default to a generic but helpful message
  return 'An unexpected error occurred. Please check your input and try again.';
};

export const createSubject = async (
  currentState: CurrentState,
  data: Subjectschema
) => {
  try {
    if (!data.name || data.name.trim() === "") {
      return { success: false, error: true, message: "Subject name is required." };
    }

    // Validate teacher IDs if provided
    if (data.teachers && data.teachers.length > 0) {
      const teacherIds = data.teachers;
      const existingTeachers = await prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true }
      });

      if (existingTeachers.length !== teacherIds.length) {
        return { success: false, error: true, message: "One or more selected teachers do not exist." };
      }
    }

    await prisma.subject.create({
      data: {
        name: data.name.trim(),
        teachers: {
          connect: data.teachers?.map((teacherId) => ({ id: teacherId })) || [],
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createSubject error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A subject with this name already exists." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: Subjectschema
) => {
  try {
    if (!data.id) {
      return { success: false, error: true, message: "Subject ID is required for update." };
    }

    if (!data.name || data.name.trim() === "") {
      return { success: false, error: true, message: "Subject name is required." };
    }

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: data.id }
    });

    if (!existingSubject) {
      return { success: false, error: true, message: "Subject not found. The subject may have been deleted." };
    }

    // Validate teacher IDs if provided
    if (data.teachers && data.teachers.length > 0) {
      const teacherIds = data.teachers;
      const existingTeachers = await prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true }
      });

      if (existingTeachers.length !== teacherIds.length) {
        return { success: false, error: true, message: "One or more selected teachers do not exist." };
      }
    }

    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name.trim(),
        teachers: {
          set: data.teachers?.map((teacherId) => ({ id: teacherId })) || [],
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateSubject error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: `A subject with this name already exists. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to update subject. Please try again." };
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
      return { success: false, error: true, message: "Subject ID is required for deletion." };
    }

    // Check if subject exists and get related data
    const subject = await prisma.subject.findUnique({
      where: { id: Number(id) },
      include: {
        lessons: { select: { id: true } },
        assignments: { select: { id: true } },
        teachers: { select: { id: true, name: true, surname: true } },
        _count: {
          select: {
            lessons: true,
            assignments: true,
            teachers: true
          }
        }
      }
    });

    if (!subject) {
      return { success: false, error: true, message: "Subject not found. The subject may have already been deleted." };
    }

    // Check if subject has many dependencies
    const totalDependencies = subject._count.lessons + subject._count.assignments;
    if (totalDependencies > 10) {
      return { success: false, error: true, message: `Cannot delete subject. It has ${totalDependencies} associated lessons and assignments. Please remove them first.` };
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
  } catch (err: any) {
    console.error("deleteSubject error:", err);

    if (err.code === 'P2025') {
      return { success: false, error: true, message: `Subject not found. The subject may have already been deleted. Error: ${err.message}` };
    }

    if (err.code === 'P2003') {
      return { success: false, error: true, message: `Cannot delete subject due to existing dependencies. Please remove associated lessons and assignments first. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to delete subject. Please try again." };
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
      return { success: false, error: true, message: "Class capacity is full. Cannot add more students to this class." };
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
  } catch (err: any) {
    console.error("createStudent error:", err);

    // Handle specific error types
    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A student with this username or email already exists." };
    }

    if (err.message?.includes('Clerk')) {
      return { success: false, error: true, message: "Failed to create user account. Please check the provided information." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentsSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "Student ID is required for update." };
  }

  try {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: data.id }
    });

    if (!existingStudent) {
      return { success: false, error: true, message: "Student not found. The student may have been deleted." };
    }

    // Check if class exists and has capacity
    if (data.classId) {
      const classItem = await prisma.class.findUnique({
        where: { id: data.classId },
        include: { _count: { select: { students: true } } },
      });

      if (!classItem) {
        return { success: false, error: true, message: "Selected class does not exist." };
      }

      // If changing to a different class, check capacity
      if (data.classId !== existingStudent.classId) {
        const currentStudentsInClass = await prisma.student.count({
          where: { classId: data.classId }
        });

        if (currentStudentsInClass >= classItem.capacity) {
          return { success: false, error: true, message: "Cannot move student to this class. Class capacity is full." };
        }
      }
    }

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
        // Don't fail the entire operation for Clerk errors
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
  } catch (err: any) {
    console.error("updateStudent error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: `A student with this username or email already exists. Error: ${err.message}` };
    }

    if (err.code === 'P2003') {
      return { success: false, error: true, message: `Invalid data provided. Please check all required fields. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to update student. Please try again." };
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
      return { success: false, error: true, message: "Student ID is required for deletion." };
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
  } catch (err: any) {
    console.error("deleteStudent error:", err);

    if (err.code === 'P2025') {
      return { success: false, error: true, message: `Student not found. It may have already been deleted. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to delete student. Please try again." };
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
  } catch (err: any) {
   console.error("createTeacher error:", err);
    if (err && typeof err === 'object' && 'errors' in err) {
      console.error('Clerk errors:', (err as any).errors);
      return { success: false, error: true, message: `Failed to create user account. Please check the provided information. Error: ${err.message}` };
    }

    if (err.code === 'P2002') {
      return { success: false, error: true, message: `A teacher with this username or email already exists. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to create teacher. Please try again." };
   }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    if (!data.id) {
      console.error("id is undefined or null");
      return { success: false, error: true, message: "Teacher ID is required for update." };
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: data.id },
    });

    if (!existingTeacher) {
      return { success: false, error: true, message: "Teacher not found. The teacher may have been deleted." };
    }

    // Validate subject IDs if provided
    if (data.subjects && data.subjects.length > 0) {
      const subjectIds = data.subjects.map(id => parseInt(id));
      const existingSubjects = await prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true }
      });

      if (existingSubjects.length !== subjectIds.length) {
        return { success: false, error: true, message: "One or more selected subjects do not exist." };
      }
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
        // Don't fail the entire operation for Clerk errors
      }
    }

    console.log("Teacher updated successfully");
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateTeacher error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: `A teacher with this username or email already exists. Error: ${err.message}` };
    }

    if (err.code === 'P2003') {
      return { success: false, error: true, message: `Invalid subject selection. Please check the subjects assigned to this teacher. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to update teacher. Please try again." };
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
      return { success: false, error: true, message: "Teacher ID is required for deletion." };
    }

    // Check if teacher exists first
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        lessons: { select: { id: true } },
        _count: {
          select: {
            lessons: true,
          }
        }
      }
    });

    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found. The teacher may have already been deleted." };
    }

    // Check for classes where this teacher is supervisor
    const supervisedClasses = await prisma.class.findMany({
      where: { supervisorId: id },
      select: { id: true, name: true }
    });

    // Check for subjects this teacher is assigned to
    const assignedSubjects = await prisma.subject.findMany({
      where: {
        teachers: {
          some: { id }
        }
      },
      select: { id: true, name: true }
    });

    // Start a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Disconnect teacher from all subjects (many-to-many relationship)
      for (const subject of assignedSubjects) {
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
  } catch (err: any) {
    console.error("deleteTeacher error:", err);

    // Handle specific error types
    if (err.code === 'P2025') {
      return { success: false, error: true, message: `Teacher not found. The teacher may have already been deleted. Error: ${err.message}` };
    }

    if (err.code === 'P2003') {
      return { success: false, error: true, message: `Cannot delete teacher due to existing dependencies. The teacher may be referenced by other records that need to be removed first. Error: ${err.message}` };
    }

    if (err.message?.includes('timeout')) {
      return { success: false, error: true, message: `Deletion timed out. The teacher has many associated records. Please try again or contact administrator. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to delete teacher. Please try again or contact administrator if the problem persists." };
  }
};


export const createParent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as ParentSchema;
  try {
    if (!data.username || !data.name || !data.surname || !data.address) {
      return { success: false, error: true, message: "Username, name, surname, and address are required." };
    }

    // Validate student IDs if provided
    if (data.studentIds && data.studentIds.length > 0) {
      const studentIds = data.studentIds;
      const existingStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, parentId: true }
      });

      if (existingStudents.length !== studentIds.length) {
        return { success: false, error: true, message: "One or more selected students do not exist." };
      }

      // Check if any students already have parents
      const studentsWithParents = existingStudents.filter(student => student.parentId);
      if (studentsWithParents.length > 0) {
        return { success: false, error: true, message: "Some selected students already have parents assigned. Please choose students without parents or remove them from other parents first." };
      }
    }

    await prisma.parent.create({
      data: {
        id: crypto.randomUUID(),
        username: data.username.trim(),
        name: data.name.trim(),
        surname: data.surname.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address.trim(),
        students: {
          connect: data.studentIds?.map((id) => ({
            id: id,
          })) || []
        },
      },
    });

    // revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createParent error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A parent with this username or email already exists." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
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
      return { success: false, error: true, message: "Parent ID is required for update." };
    }

    if (!data.username || !data.name || !data.surname || !data.address) {
      return { success: false, error: true, message: "Username, name, surname, and address are required." };
    }

    const existingParent = await prisma.parent.findUnique({
      where: { id: data.id },
    });

    if (!existingParent) {
      return { success: false, error: true, message: "Parent not found. The parent may have been deleted." };
    }

    // Validate student IDs if provided
    if (data.studentIds && data.studentIds.length > 0) {
      const studentIds = data.studentIds;
      const existingStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, parentId: true }
      });

      if (existingStudents.length !== studentIds.length) {
        return { success: false, error: true, message: "One or more selected students do not exist." };
      }

      // Check if any students already have other parents (excluding this parent)
      const studentsWithOtherParents = existingStudents.filter(student => student.parentId && student.parentId !== data.id);
      if (studentsWithOtherParents.length > 0) {
        return { success: false, error: true, message: "Some selected students already have other parents assigned. Please choose students without parents or remove them from other parents first." };
      }
    }

    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username.trim(),
        name: data.name.trim(),
        surname: data.surname.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address.trim(),
        students: {
          set: data.studentIds?.map((id) => ({ id })) || [],
        },
      },
    });

    console.log("Parent updated successfully");
    // revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateParent error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A parent with this username or email already exists." };
    }

    return { success: false, error: true, message: "Failed to update parent. Please try again." };
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
      return { success: false, error: true, message: "Parent ID is required for deletion." };
    }

    const existingParent = await prisma.parent.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (!existingParent) {
      return { success: false, error: true, message: "Parent not found. The parent may have already been deleted." };
    }

    // Note: We don't prevent deletion if parent has students - students can exist without parents
    // The relationship will be automatically cleaned up by the database

    await prisma.parent.delete({
      where: {
        id,
      },
    });

    console.log("Parent deleted successfully");
    // revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteParent error:", err);

    if (err.code === 'P2025') {
      return { success: false, error: true, message: "Parent not found. The parent may have already been deleted." };
    }

    if (err.code === 'P2003') {
      return { success: false, error: true, message: "Cannot delete parent due to existing dependencies. Please remove associated records first." };
    }

    return { success: false, error: true, message: "Failed to delete parent. Please try again." };
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
      return { success: false, error: true, message: "Class ID is required for deletion." };
    }

    const existingClass = await prisma.class.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            students: true,
            lessons: true,
            announcement: true,
            events: true
          }
        }
      }
    });

    if (!existingClass) {
      console.error("Class not found with id:", id);
      return { success: false, error: true, message: "Class not found. The class may have already been deleted." };
    }

    // Check if this is the default class (ID 1) - don't allow deletion
    if (Number(id) === 1) {
      return { success: false, error: true, message: "Cannot delete the default class. This class is used as a fallback for students." };
    }

    // Check if class has many students
    if (existingClass._count.students > 20) {
      return { success: false, error: true, message: `Cannot delete class. It has ${existingClass._count.students} students enrolled. Please move students to other classes first.` };
    }

    // Check if default class exists for fallback
    const defaultClass = await prisma.class.findUnique({
      where: { id: 1 }
    });

    if (!defaultClass) {
      return { success: false, error: true, message: "Cannot delete class. Default class (ID: 1) not found. Please ensure a default class exists." };
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
  } catch (err: any) {
    console.error("deleteClass error:", err);

    if (err.code === 'P2025') {
      return { success: false, error: true, message: "Class not found. The class may have already been deleted." };
    }

    if (err.code === 'P2003') {
      return { success: false, error: true, message: "Cannot delete class due to existing dependencies. Please remove associated records first." };
    }

    return { success: false, error: true, message: "Failed to delete class. Please try again." };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    console.log("Creating exam with data:", data);

    // Get current user role and ID
    const role = await getRole();
    const currentUserId = await getCurrentUserId();

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(data.lessonId) },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true, surname: true, id: true } }
      }
    });

    console.log("Lesson found:", lesson ? "yes" : "no");
    if (!lesson) {
      console.log("Lesson does not exist");
      return { success: false, error: true, message: "Selected lesson does not exist." };
    }

    // Role-based validation: teachers can only create exams for their own lessons
    if (role === "teacher" && currentUserId && lesson.teacher.id !== currentUserId) {
      console.log("Teacher not authorized for this lesson");
      return { success: false, error: true, message: "You can only create exams for lessons you teach." };
    }

    // Validate exam times
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    console.log("Start time:", startTime, "End time:", endTime);
    if (startTime >= endTime) {
      console.log("End time not after start time");
      return { success: false, error: true, message: "Exam end time must be after start time." };
    }

    if (startTime < new Date()) {
      console.log("Start time in past");
      return { success: false, error: true, message: "Exam start time cannot be in the past." };
    }

    // Check if exam times conflict with lesson times (only compare time of day, not date)
    const lessonStart = new Date(lesson.startTime);
    const lessonEnd = new Date(lesson.endTime);

    console.log("Lesson start:", lessonStart, "Lesson end:", lessonEnd);

    // Extract time components (hours and minutes) for comparison
    const examStartHour = startTime.getHours();
    const examStartMinute = startTime.getMinutes();
    const examEndHour = endTime.getHours();
    const examEndMinute = endTime.getMinutes();

    const lessonStartHour = lessonStart.getHours();
    const lessonStartMinute = lessonStart.getMinutes();
    const lessonEndHour = lessonEnd.getHours();
    const lessonEndMinute = lessonEnd.getMinutes();

    const examStartMinutes = examStartHour * 60 + examStartMinute;
    const examEndMinutes = examEndHour * 60 + examEndMinute;
    const lessonStartMinutes = lessonStartHour * 60 + lessonStartMinute;
    const lessonEndMinutes = lessonEndHour * 60 + lessonEndMinute;

    if (examStartMinutes < lessonStartMinutes || examEndMinutes > lessonEndMinutes) {
      console.log("Exam time not within lesson time");
      return { success: false, error: true, message: `Exam time must be within lesson time (${lessonStart.toLocaleTimeString()} - ${lessonEnd.toLocaleTimeString()}).` };
    }

    console.log("About to create exam in database");
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: startTime,
        endTime: endTime,
        lessonId: Number(data.lessonId),
      },
    });

    console.log("Exam created successfully");
    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createExam error:", err);

    if (err.code === 'P2002') {
      console.log("Duplicate exam title error");
      return { success: false, error: true, message: "An exam with this title already exists for this lesson." };
    }

    console.log("Other createExam error:", getUserFriendlyError(err));
    return { success: false, error: true, message: getUserFriendlyError(err) };
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
      return { success: false, error: true, message: "Exam ID is required for update." };
    }

    // Check if exam exists
    const existingExam = await prisma.exam.findUnique({
      where: { id: data.id },
      include: { lesson: true }
    });

    if (!existingExam) {
      return { success: false, error: true, message: "Exam not found. The exam may have been deleted." };
    }

    // Validate lesson exists if changing
    if (data.lessonId && data.lessonId !== existingExam.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId }
      });

      if (!lesson) {
        return { success: false, error: true, message: "Selected lesson does not exist." };
      }
    }

    // Validate exam times
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      return { success: false, error: true, message: "Exam end time must be after start time." };
    }

    // Get lesson times for validation
    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId || existingExam.lessonId }
    });

    if (lesson) {
      const lessonStart = new Date(lesson.startTime);
      const lessonEnd = new Date(lesson.endTime);

      if (startTime < lessonStart || endTime > lessonEnd) {
        return { success: false, error: true, message: `Exam time must be within lesson time (${lessonStart.toLocaleTimeString()} - ${lessonEnd.toLocaleTimeString()}).` };
      }
    }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: startTime,
        endTime: endTime,
        lessonId: data.lessonId,
      },
    });

    console.log("Exam updated successfully");
    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateExam error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: `An exam with this title already exists for this lesson. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to update exam. Please try again." };
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
      return { success: false, error: true, message: "Exam ID is required for deletion." };
    }

    const existingExam = await prisma.exam.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { result: true }
        }
      }
    });

    if (!existingExam) {
      return { success: false, error: true, message: "Exam not found. The exam may have already been deleted." };
    }

    // Check if exam has results
    if (existingExam._count.result > 0) {
      return { success: false, error: true, message: `Cannot delete exam. It has ${existingExam._count.result} student result(s) associated with it. Please remove the results first.` };
    }

    await prisma.exam.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Exam deleted successfully");
    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteExam error:", err);

    if (err.code === 'P2003') {
      return { success: false, error: true, message: `Cannot delete exam due to existing dependencies. Please remove associated results first. Error: ${err.message}` };
    }

    return { success: false, error: true, message: err.message || "Failed to delete exam. Please try again." };
  }
};


export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    console.log("Creating assignment with data:", data);

    // Validate subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: Number(data.subjectId) }
    });

    if (!subject) {
      return { success: false, error: true, message: "Selected subject does not exist." };
    }

    // Validate dates
    const startDate = new Date(data.startDate || Date.now());
    const dueDate = new Date(data.dueDate);

    if (dueDate <= startDate) {
      return { success: false, error: true, message: "Due date must be after the start date." };
    }

    if (dueDate < new Date()) {
      return { success: false, error: true, message: "Due date cannot be in the past." };
    }

    // Find an appropriate lesson for this subject and class
    const lesson = await prisma.lesson.findFirst({
      where: {
        subjectId: Number(data.subjectId),
        classId: Number(data.classtId)
      },
      select: { id: true }
    });

    if (!lesson) {
      return { success: false, error: true, message: "No lessons found for this subject and class combination. Please create a lesson first." };
    }

    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: startDate,
        dueDate: dueDate,
        subjectId: Number(data.subjectId),
        lessonId: lesson.id,
      },
    });

    console.log("Assignment created successfully");
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createAssignment error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "An assignment with this title already exists for this subject." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    console.log("Updating assignment with data:", data);
    console.log("Assignment id:", data.id);

    if (!data.id) {
      console.error("id is undefined or null");
      return { success: false, error: true, message: "Assignment ID is required for update." };
    }

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: Number(data.id) },
      include: { lesson: { select: { classId: true } } }
    });

    if (!existingAssignment) {
      return { success: false, error: true, message: "Assignment not found. The assignment may have been deleted." };
    }

    // Validate subject exists if changing
    if (data.subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: Number(data.subjectId) }
      });

      if (!subject) {
        return { success: false, error: true, message: "Selected subject does not exist." };
      }
    }

    // Validate dates
    const startDate = new Date(data.startDate || Date.now());
    const dueDate = new Date(data.dueDate);

    if (dueDate <= startDate) {
      return { success: false, error: true, message: "Due date must be after the start date." };
    }

    // Find appropriate lesson for the subject and class
    const subjectId = Number(data.subjectId) || existingAssignment.subjectId;
    const classId = Number(data.classtId) || existingAssignment.lesson.classId;

    const lesson = await prisma.lesson.findFirst({
      where: {
        subjectId: subjectId,
        classId: classId
      },
      select: { id: true }
    });

    if (!lesson) {
      return { success: false, error: true, message: "No lessons found for this subject and class combination. Please ensure the subject has associated lessons for the selected class." };
    }

    console.log("Found lesson:", lesson.id, "for subject", subjectId, "and class", classId);

    const updateData = {
      title: data.title,
      startDate: startDate,
      dueDate: dueDate,
      subjectId: subjectId,
      lessonId: lesson.id,
    };

    console.log("Updating assignment with data:", updateData);

    await prisma.assignment.update({
      where: {
        id: Number(data.id),
      },
      data: updateData,
    });

    console.log("Assignment updated successfully");
    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateAssignment error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "An assignment with this title already exists for this subject." };
    }

    return { success: false, error: true, message: getUserFriendlyError(err) };
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
      return { success: false, error: true, message: "Assignment ID is required for deletion." };
    }

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { result: true }
        }
      }
    });

    if (!existingAssignment) {
      return { success: false, error: true, message: "Assignment not found. The assignment may have already been deleted." };
    }

    // Check if assignment has results
    if (existingAssignment._count.result > 0) {
      return { success: false, error: true, message: `Cannot delete assignment. It has ${existingAssignment._count.result} student result(s) associated with it. Please remove the results first.` };
    }

    await prisma.assignment.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Assignment deleted successfully");
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteAssignment error:", err);

    if (err.code === 'P2003') {
      return { success: false, error: true, message: "Cannot delete assignment due to existing dependencies. Please remove associated results first." };
    }

    return { success: false, error: true, message: "Failed to delete assignment. Please try again." };
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
      return { success: false, error: true, message: "Result ID is required for deletion." };
    }

    const existingResult = await prisma.result.findUnique({
      where: { id: Number(id) },
      include: {
        student: { select: { name: true, surname: true } },
        exam: { select: { title: true } },
        assignment: { select: { title: true } }
      }
    });

    if (!existingResult) {
      return { success: false, error: true, message: "Result not found. The result may have already been deleted." };
    }

    await prisma.result.delete({
      where: {
        id: Number(id),
      },
    });

    console.log("Result deleted successfully");
    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteResult error:", err);

    if (err.code === 'P2025') {
      return { success: false, error: true, message: "Result not found. The result may have already been deleted." };
    }

    if (err.code === 'P2003') {
      return { success: false, error: true, message: "Cannot delete result due to existing dependencies." };
    }

    return { success: false, error: true, message: "Failed to delete result. Please try again." };
  }
};

export const createResult = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as ResultSchema;
  try {
    if (!data.studentId || !data.score) {
      return { success: false, error: true, message: "Student and score are required." };
    }

    if (!data.examId && !data.assignmentId) {
      return { success: false, error: true, message: "Either exam or assignment must be selected." };
    }

    if (data.examId && data.assignmentId) {
      return { success: false, error: true, message: "Cannot select both exam and assignment." };
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      return { success: false, error: true, message: "Selected student does not exist." };
    }

    // Validate exam or assignment exists and belongs to student
    if (data.examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: data.examId },
        include: { lesson: { include: { class: true } } }
      });

      if (!exam) {
        return { success: false, error: true, message: "Selected exam does not exist." };
      }

      // Check if student is in the class for this exam
      if (exam.lesson.classId !== student.classId) {
        return { success: false, error: true, message: "Student is not enrolled in the class for this exam." };
      }
    }

    if (data.assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: data.assignmentId },
        include: { lesson: { include: { class: true } } }
      });

      if (!assignment) {
        return { success: false, error: true, message: "Selected assignment does not exist." };
      }

      // Check if student is in the class for this assignment
      if (assignment.lesson.classId !== student.classId) {
        return { success: false, error: true, message: "Student is not enrolled in the class for this assignment." };
      }
    }

    // Check if result already exists
    const existingResult = await prisma.result.findFirst({
      where: {
        studentId: data.studentId,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      }
    });

    if (existingResult) {
      return { success: false, error: true, message: "A result already exists for this student and assessment." };
    }

    await prisma.result.create({
      data: {
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
        studentId: data.studentId,
      },
    });

    console.log("Result created successfully");
    // revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createResult error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A result already exists for this student and assessment." };
    }

    return { success: false, error: true, message: "Failed to create result. Please try again." };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData) as unknown as ResultSchema;
  try {
    if (!data.id) {
      return { success: false, error: true, message: "Result ID is required for update." };
    }

    if (!data.studentId || data.score === undefined) {
      return { success: false, error: true, message: "Student and score are required." };
    }

    if (!data.examId && !data.assignmentId) {
      return { success: false, error: true, message: "Either exam or assignment must be selected." };
    }

    if (data.examId && data.assignmentId) {
      return { success: false, error: true, message: "Cannot select both exam and assignment." };
    }

    // Check if result exists
    const existingResult = await prisma.result.findUnique({
      where: { id: data.id }
    });

    if (!existingResult) {
      return { success: false, error: true, message: "Result not found. The result may have been deleted." };
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      return { success: false, error: true, message: "Selected student does not exist." };
    }

    // Validate exam or assignment exists and belongs to student
    if (data.examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: data.examId },
        include: { lesson: { include: { class: true } } }
      });

      if (!exam) {
        return { success: false, error: true, message: "Selected exam does not exist." };
      }

      // Check if student is in the class for this exam
      if (exam.lesson.classId !== student.classId) {
        return { success: false, error: true, message: "Student is not enrolled in the class for this exam." };
      }
    }

    if (data.assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: data.assignmentId },
        include: { lesson: { include: { class: true } } }
      });

      if (!assignment) {
        return { success: false, error: true, message: "Selected assignment does not exist." };
      }

      // Check if student is in the class for this assignment
      if (assignment.lesson.classId !== student.classId) {
        return { success: false, error: true, message: "Student is not enrolled in the class for this assignment." };
      }
    }

    // Check if another result already exists (excluding current one)
    const conflictingResult = await prisma.result.findFirst({
      where: {
        id: { not: data.id },
        studentId: data.studentId,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      }
    });

    if (conflictingResult) {
      return { success: false, error: true, message: "A result already exists for this student and assessment." };
    }

    await prisma.result.update({
      where: { id: data.id },
      data: {
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
        studentId: data.studentId,
      },
    });

    console.log("Result updated successfully");
    // revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateResult error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A result already exists for this student and assessment." };
    }

    return { success: false, error: true, message: "Failed to update result. Please try again." };
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
    // revalidatePath("/list/attendances");
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
    // revalidatePath("/list/events");
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
    // revalidatePath("/list/announcements");
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

    // Validate subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: Number(data.subjectId) }
    });

    if (!subject) {
      return { success: false, error: true, message: "Selected subject does not exist." };
    }

    // Validate class exists
    const classItem = await prisma.class.findUnique({
      where: { id: Number(data.classId) }
    });

    if (!classItem) {
      return { success: false, error: true, message: "Selected class does not exist." };
    }

    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId }
    });

    if (!teacher) {
      return { success: false, error: true, message: "Selected teacher does not exist." };
    }

    // Validate time logic
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      return { success: false, error: true, message: "Lesson end time must be after start time." };
    }

    // Check for time conflicts with other lessons in the same class on the same day
    const conflictingLesson = await prisma.lesson.findFirst({
      where: {
        classId: Number(data.classId),
        day: data.day,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingLesson) {
      return { success: false, error: true, message: `Time conflict with another lesson in this class on ${data.day}.` };
    }

    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: startTime,
        endTime: endTime,
        subjectId: Number(data.subjectId),
        classId: Number(data.classId),
        teacherId: data.teacherId,
      },
    });

    console.log("Lesson created successfully");
    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createLesson error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A lesson with this name already exists for this class and day." };
    }

    return { success: false, error: true, message: "Failed to create lesson. Please try again." };
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
      return { success: false, error: true, message: "Lesson ID is required for update." };
    }

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: Number(data.id) }
    });

    if (!existingLesson) {
      return { success: false, error: true, message: "Lesson not found. The lesson may have been deleted." };
    }

    // Validate related entities if changing
    if (data.subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: Number(data.subjectId) }
      });
      if (!subject) {
        return { success: false, error: true, message: "Selected subject does not exist." };
      }
    }

    if (data.classId) {
      const classItem = await prisma.class.findUnique({
        where: { id: Number(data.classId) }
      });
      if (!classItem) {
        return { success: false, error: true, message: "Selected class does not exist." };
      }
    }

    if (data.teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: data.teacherId }
      });
      if (!teacher) {
        return { success: false, error: true, message: "Selected teacher does not exist." };
      }
    }

    // Validate time logic
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      return { success: false, error: true, message: "Lesson end time must be after start time." };
    }

    // Check for time conflicts (excluding current lesson)
    const conflictingLesson = await prisma.lesson.findFirst({
      where: {
        id: { not: Number(data.id) },
        classId: Number(data.classId),
        day: data.day,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingLesson) {
      return { success: false, error: true, message: `Time conflict with another lesson in this class on ${data.day}.` };
    }

    await prisma.lesson.update({
      where: {
        id: Number(data.id),
      },
      data: {
        name: data.name,
        day: data.day,
        startTime: startTime,
        endTime: endTime,
        subjectId: Number(data.subjectId),
        classId: Number(data.classId),
        teacherId: data.teacherId,
      },
    });

    console.log("Lesson updated successfully");
    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateLesson error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A lesson with this name already exists for this class and day." };
    }

    return { success: false, error: true, message: "Failed to update lesson. Please try again." };
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
      return { success: false, error: true, message: "Lesson ID is required for deletion." };
    }

    const existingLesson = await prisma.lesson.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            attendance: true,
            exams: true,
            assignments: true
          }
        }
      }
    });

    if (!existingLesson) {
      return { success: false, error: true, message: "Lesson not found. The lesson may have already been deleted." };
    }

    // Check for dependencies
    const totalDependencies = existingLesson._count.attendance + existingLesson._count.exams + existingLesson._count.assignments;

    if (totalDependencies > 0) {
      return {
        success: false,
        error: true,
        message: `Cannot delete lesson. It has ${existingLesson._count.attendance} attendance records, ${existingLesson._count.exams} exams, and ${existingLesson._count.assignments} assignments associated with it. Please remove these first.`
      };
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
  } catch (err: any) {
    console.error("deleteLesson error:", err);

    if (err.code === 'P2003') {
      return { success: false, error: true, message: "Cannot delete lesson due to existing dependencies. Please remove associated records first." };
    }

    return { success: false, error: true, message: "Failed to delete lesson. Please try again." };
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

    if (!name || !capacity || !gradeId) {
      return { success: false, error: true, message: "Name, capacity, and grade are required." };
    }

    // Validate grade exists
    const grade = await prisma.grade.findUnique({
      where: { id: parseInt(gradeId) }
    });

    if (!grade) {
      return { success: false, error: true, message: "Selected grade does not exist." };
    }

    // Validate supervisor if provided
    if (supervisorId) {
      const supervisor = await prisma.teacher.findUnique({
        where: { id: supervisorId }
      });

      if (!supervisor) {
        return { success: false, error: true, message: "Selected supervisor (teacher) does not exist." };
      }
    }

    // Validate capacity
    const capacityNum = parseInt(capacity);
    if (capacityNum <= 0 || capacityNum > 50) {
      return { success: false, error: true, message: "Capacity must be between 1 and 50." };
    }

    await prisma.class.create({
      data: {
        name,
        capacity: capacityNum,
        gradeId: parseInt(gradeId),
        supervisorId: supervisorId || null,
      },
    });

    // revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createClass error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A class with this name already exists." };
    }

    return { success: false, error: true, message: "Failed to create class. Please try again." };
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
      return { success: false, error: true, message: "Class ID is required for update." };
    }

    const existingClass = await prisma.class.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (!existingClass) {
      return { success: false, error: true, message: "Class not found. The class may have been deleted." };
    }

    // Validate grade exists if changing
    if (gradeId) {
      const grade = await prisma.grade.findUnique({
        where: { id: parseInt(gradeId) }
      });

      if (!grade) {
        return { success: false, error: true, message: "Selected grade does not exist." };
      }
    }

    // Validate supervisor if provided
    if (supervisorId) {
      const supervisor = await prisma.teacher.findUnique({
        where: { id: supervisorId }
      });

      if (!supervisor) {
        return { success: false, error: true, message: "Selected supervisor (teacher) does not exist." };
      }
    }

    // Validate capacity
    const capacityNum = parseInt(capacity);
    if (capacityNum <= 0 || capacityNum > 50) {
      return { success: false, error: true, message: "Capacity must be between 1 and 50." };
    }

    // Check if new capacity is less than current students
    if (capacityNum < existingClass._count.students) {
      return { success: false, error: true, message: `Cannot reduce capacity to ${capacityNum}. Class currently has ${existingClass._count.students} students enrolled.` };
    }

    await prisma.class.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        capacity: capacityNum,
        gradeId: parseInt(gradeId),
        supervisorId: supervisorId || null,
      },
    });

    console.log("Class updated successfully");
    // revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateClass error:", err);

    if (err.code === 'P2002') {
      return { success: false, error: true, message: "A class with this name already exists." };
    }

    return { success: false, error: true, message: "Failed to update class. Please try again." };
  }
};
