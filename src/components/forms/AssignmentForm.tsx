"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, startTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { assignmentSchema, AssignmentSchema } from "@/lib/FormValidationSchema";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import ErrorDisplay from "../ErrorDisplay";

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
      subjectId: data?.subjectId?.toString() || "",
      classtId: data?.lesson?.class?.id?.toString() || "",
      startDate: data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
      dueDate: data?.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "",
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createAssignment : updateAssignment,
    {
      success: false,
      error: false,
      message: undefined,
    } as { success: boolean; error: boolean; message?: string }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    console.log("Submitting assignment form data:", formData);

    // Process the data before submission
    const processedData = {
      title: formData.title,
      subjectId: parseInt(formData.subjectId),
      classtId: formData.classtId ? parseInt(formData.classtId) : 0, // Use 0 as default if not provided
      startDate: new Date(formData.startDate),
      dueDate: new Date(formData.dueDate),
      id: data?.id ? parseInt(data.id.toString()) : undefined, // Get id from component props
    };

    console.log("Processed assignment data:", processedData);
    startTransition(() => {
      formAction(processedData);
    });
  });

  useEffect(() => {
    if (state.success) {
      toast.success(`Assignment has been ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen?.(false);
      router.refresh();
    } else if ((state as any).error) {
      const errorMessage = (state as any).message || "Something went wrong!";
      toast.error(errorMessage);
    }
  }, [state.success, state.error, type, router, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
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

        {/* Hidden ID for Update - not needed since we get it from props */}

      </div>
      {(state as any).error && (state as any).message && (
        <ErrorDisplay message={(state as any).message} />
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AssignmentForm;