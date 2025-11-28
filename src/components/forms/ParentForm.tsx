"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { parentSchema } from "@/lib/FormValidationSchema";
import { createParent, updateParent } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type Inputs = z.infer<typeof parentSchema>;

const ParentForm = ({
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    data?.students?.map((s: any) => s.id) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<z.infer<typeof parentSchema>>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      username: data?.username || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      studentIds: selectedStudents,
      id: data?.id,
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createParent : updateParent,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Parent has been ${type === "create" ? "created" : "updated"} successfully!`
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state.success, state.error, type, router, setOpen]);

  const { students } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" action={formAction}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new parent" : "Update parent"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
          inputProps={{}}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
          inputProps={{}}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={type === "update" ? "password" : data?.password}
          register={register}
          error={errors?.password}
          inputProps={{}}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          inputProps={{}}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors?.surname}
          inputProps={{}}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors?.phone}
          inputProps={{}}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors?.address}
          inputProps={{}}
        />
        {data && (
          <input type="hidden" {...register("id")} defaultValue={data?.id} />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Students</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            value={selectedStudents}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedStudents(values);
              setValue("studentIds", values);
            }}
          >
            {students?.map((student: { id: string; name: string; surname: string }) => (
              <option key={student.id} value={student.id}>
                {student.name + " " + student.surname}
              </option>
            ))}
          </select>
          {errors.studentIds?.message && (
            <p className="text-red-400 text-xs">
              {errors.studentIds.message.toString()}
            </p>
          )}
        </div>
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ParentForm;