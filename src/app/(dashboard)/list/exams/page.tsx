import FormModel from "@/components/FormModel";
import FormContainer from "@/components/forms/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getRole, getCurrentUserId } from "@/lib/utils";
import {
  Class,
  Exam,
  Prisma,
  PrismaClient,
  Subject,
  Teacher,
} from "@prisma/client";
import Image from "next/image";
import React from "react";

type ExamList = Exam & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};
const ExamListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const searchParamsResolved = await searchParams;
  const { page, ...queryParams } = searchParamsResolved;
  const p = page ? parseInt(page) : 1;

  const role = await getRole();
  const currentUserId = await getCurrentUserId();

  const columns = [
    {
      header: "Subject Name",
      accessor: "info",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  // URL PARAMS CONDITION
  const query: Prisma.ExamWhereInput = {};

  query.lesson = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lesson.classId = parseInt(value) ;
            break;
          case "teacherId":
            query.lesson.teacherId= value ;
            break;
          case "search":
            query.lesson.subject = {
              name: { contains: value, mode: "insensitive" },
            };
            break;
          default:
            break;
        }
      }
    }
  }


  // ROLE CONDITIONS

  switch (role) {
    case "admin":
       break;
    case "teacher":
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
      case "parent":
        query.lesson.class = {
          students: {
            some: {
              parentId: currentUserId!,
            },
          },
        };
        break;
    default:
      break;
  }
  const prisma = new PrismaClient();

  const [data, count] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        lesson: {
          include: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
            class: { select: { name: true } },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.exam.count({ where: query }),
  ]);

  // Get lessons for the form
  const lessonsData = await prisma.lesson.findMany({
    include: {
      subject: { select: { name: true } },
      teacher: { select: { name: true, surname: true } },
      class: { select: { name: true } },
    },
  });

  const renderRow = (item: ExamList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-200 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">{item.lesson.subject.name}</div>
      </td>
      <td>{item?.lesson.class.name}</td>
      <td className="hidden md:table-cell">
        {item?.lesson.teacher.name + " " + item.lesson.teacher.surname}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.startTime)}
      </td>

      <td>
        <div className="flex items-center gap-4">
          <FormContainer table="exam" type="update" data={item} relatedData={{ lessons: lessonsData }} />

          <FormContainer table="exam" type="delete" id={item.id}  />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Top */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg hidden md:block font-semibold">All Exams</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto"></div>
        <TableSearch />
        <div className="flex items-center gap-4 self-end">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/filter.png" alt="" width={14} height={14} />
          </button>

          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/sort.png" alt="" width={14} height={14} />
          </button>

          <FormModel table="exam" type="create" relatedData={{ lessons: lessonsData }} />
        </div>
      </div>
      {/* List */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <div className="">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ExamListPage;
