"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  useActionState,
  useEffect,
  useState,
  startTransition,
} from "react";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { StudentsSchema, studentsSchema } from "@/lib/FormValidationSchema";
import {
  createStudent,
  createTeacher,
  updateStudent,
  updateTeacher,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const StudentForm = ({
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
    data?.subjects?.map((s: any) => s.id) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(studentsSchema),
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
      parentId: data?.parentId || "",
      gradeId: data?.gradeId || "",
      classId: data?.classId || "",
      id: data?.id,
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createStudent : updateStudent,
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
      });
    });
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Student has been ${
          type === "create" ? "created" : "updated"
        } successfully!`
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state.success, state.error, type, router, setOpen]);

  const { grades, classes } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new student" : "Update student"}
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
              <Image src="/upload.png" alt="" width={28} height={28} id="img" />
              <span>Upload a photo</span>
            </div>
          );
        }}
      </CldUploadWidget>
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
        <InputField
          label="ParentId"
          name="parentId"
          register={register}
          error={errors?.parentId}
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
          <label className="text-xs text-gray-500">Grade</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradeId")}
            defaultValue={data?.gradeId}
          >
            {grades?.map((grade: { id: number; level: string }) => (
              <option key={grade.id} value={grade.id.toString()}>
                {grade.level}
              </option>
            ))}
          </select>
          {errors.gradeId?.message && (
            <p className="text-red-400 text-xs">
              {errors.gradeId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            defaultValue={data?.classId}
          >
            {classes?.map(
              (classItem: {
                id: number;
                name: string;
                capacity: number;
                _count: { students: number };
              }) => (
                <option key={classItem.id} value={classItem.id}>
                  ({classItem.name} -{" "}
                  {(classItem._count.students ?? 0) + "/" + classItem.capacity}{" "}
                  Capacity)
                </option>
              )
            )}
          </select>
          {errors.classId?.message && (
            <p className="text-red-400 text-xs">
              {errors.classId.message.toString()}
            </p>
          )}
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

export default StudentForm;
