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
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { teacherSchema } from "@/lib/FormValidationSchema";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const TeacherForm = ({
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
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    data?.subjects?.map((s: any) => s.id.toString()) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      username: data?.username || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      bloodType: data?.bloodType || "",
      sex: data?.sex || "",
      birthday: data?.birthday
        ? new Date(data.birthday).toISOString().split("T")[0]
        : "",
      subjects: selectedSubjects,
      id: data?.id,
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const [img, setImage] = useState<any>();
  const onSubmit = handleSubmit((data) => {
    startTransition(() => {
      formAction({
        ...data,
        img: img?.secure_url,
        subjects: selectedSubjects,
      });
    });
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Teacher has been ${
          type === "create" ? "created" : "updated"
        } successfully!`
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state.success, state.error, type, router, setOpen]);

  const { subjects } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update teacher"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Infomration
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
        Personal Infomration
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

        <InputField
          label="Blood Type"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors?.bloodType}
          inputProps={{}}
        />

        <InputField
          label="Birthday"
          name="birthday"
          defaultValue={type === "create" ? data?.birthday : undefined}
          register={register}
          error={errors?.birthday}
          type="date"
          inputProps={{}}
        />

        {data && (
          <input type="hidden" {...register("id")} defaultValue={data?.id} />
        )}

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-red-400 text-xs">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subjects</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            value={selectedSubjects}
            onChange={(e) => {
              const values = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              setSelectedSubjects(values);
              setValue("subjects", values);
            }}
          >
            {relatedData?.subjects?.map(
              (subject: { id: number; name: string }) => (
                <option key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </option>
              )
            )}
          </select>
          {/* {errors.sex?.message && (
            <p className="text-red-400 text-xs">
              {errors.sex.message.toString()}
            </p>
          )} */}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Photo</label>
          <CldUploadWidget
            uploadPreset="SchoolHub"
            onSuccess={(result, { widget }) => {
              setImage(result.info);
              widget.close();
            }}
          >
            {({ open }) => {
              return (
                <div
                  className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                  onClick={() => open?.()}
                >
                  <Image
                    src="/upload.png"
                    alt=""
                    width={28}
                    height={28}
                    id="img"
                  />
                  <span>Upload a photo</span>
                </div>
              );
            }}
          </CldUploadWidget>
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default TeacherForm;
