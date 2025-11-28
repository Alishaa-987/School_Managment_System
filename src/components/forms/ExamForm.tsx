"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  useActionState,
  useEffect,
  useState,
  startTransition,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { createExam, updateExam } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: "Title is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  lessonId: z.string().min(1, { message: "Lesson is required" }),
});

type Inputs = z.infer<typeof schema>;

const ExamForm = ({
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
    defaultValues: {
      id: data?.id?.toString() || "",
      title: data?.title || "",
      startTime: data?.startTime
        ? new Date(data.startTime).toISOString().slice(0, 16)
        : "",
      endTime: data?.endTime
        ? new Date(data.endTime).toISOString().slice(0, 16)
        : "",
      lessonId: data?.lessonId?.toString() || "",
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    startTransition(() => {
      formAction({
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        lessonId: parseInt(data.lessonId),
        id: data.id ? parseInt(data.id) : undefined
      });
    });
  });
  useEffect(() => {
    if (state.success) {
      toast.success(
        `Exam has been ${type === "create" ? "created" : "updated"} successfully!`
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state.success, state.error, type, router, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new exam" : "Update exam"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Exam Information
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
          label="Start Time"
          name="startTime"
          type="datetime-local"
          defaultValue={data?.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : ""}
          register={register}
          error={errors?.startTime}
          inputProps={{}}
        />
        <InputField
          label="End Time"
          name="endTime"
          type="datetime-local"
          defaultValue={data?.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : ""}
          register={register}
          error={errors?.endTime}
          inputProps={{}}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
            defaultValue={data?.lessonId}
          >
            {relatedData?.lessons?.map(
              (lesson: { id: number; subject: { name: string }; class: { name: string }; teacher: { name: string; surname: string } }) => (
                <option key={lesson.id} value={lesson.id.toString()}>
                  {lesson.subject.name} - {lesson.class.name} ({lesson.teacher.name} {lesson.teacher.surname})
                </option>
              )
            )}
          </select>
          {errors.lessonId?.message && (
            <p className="text-red-400 text-xs">
              {errors.lessonId.message.toString()}
            </p>
          )}
        </div>

        {type === "update" && (
          <input type="hidden" {...register("id")} value={data?.id?.toString()} />
        )}
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;