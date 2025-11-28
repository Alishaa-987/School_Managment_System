import { Day } from "@prisma/client";
import { z } from "zod";
export const subjectschema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, { message: "Subject name is required" }),
    teachers: z.array(z.string()),  // teacherIds
});
export type Subjectschema = z.infer<typeof subjectschema>;


export const classSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, { message: "Class name is required" }),
    capacity: z.coerce.number().min(1, { message: "Class capacity is required" }),
    gradeId: z.coerce.number().min(1, { message: "Class grade is required" }),
    supervisorId: z.string().optional(),  // teacherIds
});
export type ClassSchema = z.infer<typeof classSchema>;


export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "username must be atleast three character long!" })
    .max(20, { message: "username must be atleast three character long!" }),

  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  password: z
    .string()
    .min(8, { message: "password must be atleast 8 character long" }),

  name: z.string().min(1, { message: "First Name is required" }),
  surname: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().optional(),
  address: z.string(),
  bloodType: z.string().min(1, { message: "Blood Type is required" }),

  birthday: z.coerce.date({ message: "Birthday is required" }),
  sex: z.enum(["Male", "Female"], { message: "Sex is required" }).optional().or(z.literal("")),
  img: z.string().optional(),
  subjects: z.array(z.string()).optional(),  // store subjects ids
});
export type TeacherSchema = z.infer<typeof teacherSchema>;



export const studentsSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "username must be atleast three character long!" })
    .max(20, { message: "username must be atleast three character long!" }),

  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  password: z
    .string()
    .min(8, { message: "password must be atleast 8 character long" })
    .optional(),

  name: z.string().min(1, { message: "First Name is required" }),
  surname: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().optional(),
  address: z.string(),
  bloodType: z.string().min(1, { message: "Blood Type is required" }),

  birthday: z.coerce.date({ message: "Birthday is required" }),
  sex: z.enum(["Male", "Female"], { message: "Sex is required" }).optional().or(z.literal("")),
  img: z.string().optional(),
  gradeId : z.coerce.number().min(1, {message: " Grade is required"}),
  classId : z.coerce.number().min(1, {message: " Class is required"}),
  parentId : z.string().optional(),

});
export type StudentsSchema = z.infer<typeof studentsSchema>;


export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;


export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "username must be atleast three character long!" })
    .max(20, { message: "username must be atleast three character long!" }),

  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  password: z
    .string()
    .min(8, { message: "password must be atleast 8 character long" }),

  name: z.string().min(1, { message: "First Name is required" }),
  surname: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().optional(),
  address: z.string(),

  studentIds: z.array(z.string()), // for selecting multiple students
});
export type ParentSchema = z.infer<typeof parentSchema>;


export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
   subjectId: z.coerce.number({ message: "Subject is required!" }),
  classId: z.coerce.number({ message: "Class is required!" }),
  teacherId: z.string({ message: "Teacher is required!" }),

  // 🟢 Add this for selecting the day
  day: z.nativeEnum(Day, { message: "Day is required!" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startDate: z.coerce.date({ message: "Start Date is required!" }),
  dueDate: z.coerce.date({ message: "Due Date is required!" }),
  subjectId: z.coerce.number({ message: "Subject is required!" }),
  classtId: z.coerce.number({ message: "Class is required!" }),

});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;