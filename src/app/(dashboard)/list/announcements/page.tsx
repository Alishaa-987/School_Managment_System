import FormModel from "@/components/FormModel";
import FormContainer from "@/components/forms/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getCurrentUserId, getRole } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Prisma, PrismaClient } from "@prisma/client";
import Image from "next/image";
import React from "react";

type AnnouncementList = {
  id: number;
  title: string;
  description: string;
  date: Date;
};
const AnnouncmentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const searchParamsResolved = await searchParams;
  console.log(searchParamsResolved);
  const { page, ...queryParams } = searchParamsResolved;
  const p = page ? parseInt(page) : 1;

  const role = await getRole();
  const currentUserId = await getCurrentUserId();

  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },

     ...((role === "admin" || role === "teacher") ? [{
       header: "Actions",
       accessor: "action",
     }] :  []),
   ];

  const renderRow = (item: AnnouncementList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-200 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">{item.title}</div>
      </td>
     {/* <td >{item.class?.name || "-"}</td> */}
    <td className="hidden md:table-cell">{new Intl.DateTimeFormat("en-US").format(item.date)}</td>


      <td>
        <div className="flex items-center gap-4">

          {(role === "admin" || role === "teacher") && (
              <>
              <FormContainer table="announcement" type="update" data={item} />

            <FormContainer table="announcement" type="delete" id={item.id} /></>
          )}
        </div>
      </td>
    </tr>
  );

  // URL PARAMS CONDITION
  const query: any = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
       case "search":
            query.title = { contains: value, mode:"insensitive" }
            break;
            default:
            break;

        }
      }
    }
  }
    // Role Conditions
      const roleConditions = {
        teacher:{lessons:{some:{teacherId:currentUserId!}}},
        student:{students:{some:{id:currentUserId!}}},
        parent:{students:{some:{parentId:currentUserId!}}},
      }

      query.OR = [
        {classId: null},
        {class: roleConditions[role as keyof typeof roleConditions] || {},
      },
      ];
    const prisma = new PrismaClient();
    const [data, count] = await prisma.$transaction([
      prisma.announcement.findMany({
        where: query,
        include: {
          class: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.announcement.count({ where: query }),
    ]);


  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Top */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg hidden md:block font-semibold">All Announcements</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto"></div>
        <TableSearch />
        <div className="flex items-center gap-4 self-end">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/filter.png" alt="" width={14} height={14} />
          </button>

          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/sort.png" alt="" width={14} height={14} />
          </button>

          {(role === "admin" || role === "teacher") && (
            <FormContainer table="announcement" type="create" />

          )}
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

export default AnnouncmentListPage;
