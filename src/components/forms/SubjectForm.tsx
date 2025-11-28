"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { subjectschema, Subjectschema } from "@/lib/FormValidationSchema";
import { createSubject, updateSubject } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});

type Inputs = z.infer<typeof schema>;

const SubjectForm = ({
  type,
  data,
  setOpen,
  relatedData
}: {
  type: "create" | "update";
  data?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  relatedData?:any;
}) => {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
    data?.teachers?.map((t: any) => t.id) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<z.infer<typeof subjectschema>>({
    resolver: zodResolver(subjectschema),
    defaultValues: {
      name: data?.name || "",
      teachers: selectedTeachers,
      id: data?.id,
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createSubject : updateSubject,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Subject has been ${
          type === "create" ? "created" : "updated"
        } successfully!`
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state.success, state.error, type, router, setOpen]);

  const {teachers} = relatedData;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new subject" : "Update subject"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        {type === "update" && (
          <input type="hidden" {...register("id")} value={data?.id} />
        )}
        <InputField
          label="Subject Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          inputProps={{}}
        />
          
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Teachers</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            value={selectedTeachers}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedTeachers(values);
              setValue("teachers", values);
            }}
          >
            {teachers.map((teacher :{id: string ;  name: string; surname: string}) => (
              <option key={teacher.id}  value={teacher.id}>{teacher.name + " " + teacher.surname} </option>
            ))}
          </select>
          {errors.teachers?.message && (
            <p className="text-red-400 text-xs">
              {errors.teachers.message.toString()}
            </p>
          )}
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default SubjectForm;
