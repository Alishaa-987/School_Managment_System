import React from "react";
import FormModel from "../FormModel";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  relatedData?: any;
};

const FormContainer = async ({ table, type, data, id, relatedData: propRelatedData }: FormContainerProps) => {
  let relatedData = propRelatedData || {};
  const {userId , sessionClaims} = await auth();
  const role = (sessionClaims?.metadata as {role? : string}) ?.role;
  const currentUserId = userId;

  if (type != "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: {
            id: true,
            name: true,
            surname: true,
          },
        });
        relatedData = { teachers: subjectTeachers };
        break;

      case "class":
        const classGrades = await prisma.grade.findMany({
          select: {
            id: true,
            level: true,
          },
        });

        const classTeachers = await prisma.teacher.findMany({
          select: {
            id: true,
            name: true,
            surname: true,
          },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;

      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: {
            id: true,
            name: true,
          },
        });

        relatedData = { subjects: teacherSubjects };
        break;


        case "student":
          const studentGrades = await prisma.grade.findMany({
            select: {
              id: true,
              level: true,
            },
          });
  
          const studentClasses = await prisma.class.findMany({
            select: {
              id: true,
              name: true,
              capacity: true,
              _count: {
                select: { students: true }
              }
            }
          });
  
          relatedData = { classes: studentClasses, grades: studentGrades };
          break;
  
        case "lesson":
          const lessonClasses = await prisma.class.findMany({
            select: {
              id: true,
              name: true,
            },
          });
          const lessonSubjects = await prisma.subject.findMany({
            select: {
              id: true,
              name: true,
            },
          });
          const lessonTeachers = await prisma.teacher.findMany({
            select: {
              id: true,
              name: true,
              surname: true,
            },
          });
          relatedData = { classes: lessonClasses, subjects: lessonSubjects, teachers: lessonTeachers };
          break;

        case "exam":
          const examLessons = await prisma.lesson.findMany({
            include: {
              subject: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
              class: { select: { name: true } },
            },
          });
          relatedData = { lessons: examLessons };
          break;

        case "parent":
          const parentStudents = await prisma.student.findMany({
            select: {
              id: true,
              name: true,
              surname: true,
            },
          });
          relatedData = { students: parentStudents };
          break;

        case "assignment":
          const assignmentSubjects = await prisma.subject.findMany({
            select: {
              id: true,
              name: true,
            },
          });
          const assignmentClasses = await prisma.class.findMany({
            select: {
              id: true,
              name: true,
            },
          });
          relatedData = { subjects: assignmentSubjects, classes: assignmentClasses };
          break;

        case "announcement":
        case "event":
          const eventClasses = await prisma.class.findMany({
            select: {
              id: true,
              name: true,
            },
          });
          relatedData = { classes: eventClasses };
          break;

        default:
          break;
    }
  }
  return (
    <div>
      <FormModel
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
