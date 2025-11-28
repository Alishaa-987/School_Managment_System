"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { assignmentSchema, AssignmentSchema } from "@/lib/FormValidationSchema";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

type Inputs = z.infer<AssignmentSchema>;

const AssignmentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: data?.title || "",
      subjectId: data?.subjectId?.toString() || data?.subject?.id?.toString() || "",
      classtId: data?.classtId?.toString() || data?.class?.id?.toString() || "",
      startDate: data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
      dueDate: data?.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "",
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createAssignment : updateAssignment,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Assignment has been ${type === "create" ? "created" : "updated"}!`);
      setOpen?.(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" action={formAction}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new assignment" : "Update assignment"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Assignment Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label=" Assignment Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
          inputProps={{}}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subject</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjectId")}
            defaultValue={data?.subjectId || ""}
          >
            <option value="">Select Subject</option>
            {relatedData?.subjects?.map((subject: { id: number; name: string }) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classtId")}
            defaultValue={data?.classtId || ""}
          >
            <option value="">Select Class</option>
            {relatedData?.classes?.map((cls: { id: number; name: string }) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
         <InputField
          label="Start Date"
          name="startDate"
          type="date"
          defaultValue={data?.startDate}
          register={register}
          error={errors?.startDate}
          inputProps={{}}
        />
        <InputField
          label="Due Date"
          name="dueDate"
          type="date"
          defaultValue={data?.dueDate}
          register={register}
          error={errors?.dueDate}
          inputProps={{}}
        />

        {/* Hidden ID for Update */}
        {data && (
          <input
            type="hidden"
            name="id"
            defaultValue={data?.id}
          />
        )}
   
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AssignmentForm;