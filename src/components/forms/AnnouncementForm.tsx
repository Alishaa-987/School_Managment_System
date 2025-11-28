"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { startTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const schema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  classId: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  React.useEffect(() => {
    if (state.success) {
      toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      const errorMessage = (state as any).message || `Failed to ${type} announcement. Please try again.`;
      toast.error(errorMessage);
    }
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    const formDataObj = new FormData();
    formDataObj.append("title", formData.title);
    formDataObj.append("description", formData.description);
    formDataObj.append("date", formData.date);
    if (formData.classId) {
      formDataObj.append("classId", formData.classId);
    }
    if (type === "update" && data?.id) {
      formDataObj.append("id", data.id.toString());
    }
    startTransition(() => {
      formAction(formDataObj);
    });
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new announcement" : "Update announcement"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Announcement Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
          inputProps={{}}
        />
        <InputField
          label="Description"
          name="description"
          defaultValue={data?.description}
          register={register}
          error={errors?.description}
          inputProps={{}}
        />
        <InputField
          label="Date"
          name="date"
          type="date"
          defaultValue={data?.date?.toISOString().split('T')[0]}
          register={register}
          error={errors?.date}
          inputProps={{}}
        />
        {relatedData?.classes && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Class (Optional)</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("classId")}
              defaultValue={data?.classId || ""}
            >
              <option value="">All Classes</option>
              {relatedData.classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.classId && (
              <p className="text-xs text-red-400">{errors.classId.message}</p>
            )}
          </div>
        )}
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AnnouncementForm;