import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ADMIN
  await prisma.admin.upsert({
    where: { id: "admin1" },
    update: {},
    create: {
      id: "admin1",
      username: "admin1",
    },
  });
  await prisma.admin.upsert({
    where: { id: "admin2" },
    update: {},
    create: {
      id: "admin2",
      username: "admin2",
    },
  });

  // GRADE
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.upsert({
      where: { level: i },
      update: {},
      create: { level: i },
    });
  }

  // SUBJECT
  const subjectData = [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English" },
    { name: "History" },
    { name: "Geography" },
    { name: "Physics" },
    { name: "Chemistry" },
    { name: "Biology" },
    { name: "Computer Science" },
    { name: "Art" },
  ];

  for (let i = 0; i < subjectData.length; i++) {
    await prisma.subject.upsert({
      where: { id: i + 1 },
      update: {},
      create: subjectData[i],
    });
  }

  // TEACHER
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.upsert({
      where: { id: `teacher${i}` },
      update: {},
      create: {
        id: `teacher${i}`, // Unique ID for the teacher
        username: `teacher${i}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      },
    });
  }

  // CLASS
  for (let i = 1; i <= 6; i++) {
    await prisma.class.upsert({
      where: { id: i },
      update: {},
      create: {
        name: `${i}A`,
        gradeId: i,
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
        supervisorId: `teacher${i}`,
      },
    });
  }

  // Assign teachers to subjects
  // Commented out to avoid seed failure
  /*
  for (let i = 1; i <= 10; i++) {
    const subjectId = i;
    const teacherIds = [`teacher${(i % 15) + 1}`, `teacher${((i + 1) % 15) + 1}`];
    await prisma.subject.update({
      where: { id: subjectId },
      data: {
        teachers: {
          connect: teacherIds.map(id => ({ id })),
        },
      },
    });
  }
  */

  // LESSON - Create lessons for current week
  const lessonToday = new Date();
  const lessonMonday = new Date(lessonToday);
  lessonMonday.setDate(lessonToday.getDate() - (lessonToday.getDay() === 0 ? 6 : lessonToday.getDay() - 1));

  const lessonDaysOfWeek = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];
  let lessonId = 1;

  for (let dayIndex = 0; dayIndex < 5; dayIndex++) { // Mon to Fri
    const lessonDate = new Date(lessonMonday);
    lessonDate.setDate(lessonMonday.getDate() + dayIndex);

    for (let lessonNum = 1; lessonNum <= 2; lessonNum++) { // 2 lessons per day
      const startHour = 8 + lessonNum; // Start from 9 AM
      const startTime = new Date(lessonDate);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(lessonDate);
      endTime.setHours(startHour + 1, 0, 0, 0);

      await prisma.lesson.upsert({
        where: { id: lessonId },
        update: {},
        create: {
          name: `Lesson${lessonId}`,
          day: lessonDaysOfWeek[dayIndex],
          startTime: startTime,
          endTime: endTime,
          subjectId: (lessonId % 10) + 1,
          classId: (lessonId % 6) + 1,
          teacherId: `teacher${(lessonId % 15) + 1}`,
        },
      });
      lessonId++;
    }
  }

  // PARENT
  for (let i = 1; i <= 25; i++) {
    await prisma.parent.upsert({
      where: { id: `parent${i}` },
      update: {},
      create: {
        id: `parent${i}`,
        username: `parent${i}`,
        name: `PName${i}`,
        surname: `PSurname${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // STUDENT
  for (let i = 1; i <= 10; i++) {
    await prisma.student.upsert({
      where: { id: `student${i}` },
      update: {},
      create: {
        id: `student${i}`,
        username: `student${i}`,
        name: `SName${i}`,
        surname: `SSurname${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parent${Math.ceil(i / 2) % 25 || 25}`,
        gradeId: (i % 6) + 1,
        classId: (i % 6) + 1,
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    });
  }

  // EXAM
  for (let i = 1; i <= 10; i++) {
    await prisma.exam.upsert({
      where: { id: i },
      update: {},
      create: {
        title: `Exam${i}`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)),
        lessonId: (i % 30) + 1,
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    await prisma.assignment.upsert({
      where: { id: i },
      update: {},
      create: {
        title: `Assignment${i}`,
        startDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        subjectId: (i % 10) + 1,
        lessonId: (i % 30) + 1,
      },
    });
  }

  // RESULT
  for (let i = 1; i <= 10; i++) {
    await prisma.result.upsert({
      where: { id: i },
      update: {},
      create: {
        score: Math.floor(Math.random() * 100) + 1,
        examId: (i % 10) + 1,
        assignmentId: (i % 10) + 1,
        studentId: `student${(i % 50) + 1}`,
      },
    });
  }

  // ATTENDANCE - Create for current week
  const today = new Date();
  let attendanceId = 1;

  // Calculate Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) { // Mon to Fri
    const attendanceDate = new Date(monday);
    attendanceDate.setDate(monday.getDate() + dayOffset);

    for (let studentNum = 1; studentNum <= 10; studentNum++) {
      await prisma.attendance.upsert({
        where: { id: attendanceId },
        update: {},
        create: {
          date: attendanceDate,
          present: Math.random() > 0.2, // 80% present rate
          studentId: `student${studentNum}`,
          lessonId: (studentNum % 10) + 1,
        },
      });
      attendanceId++;
    }
  }

  // EVENT
  for (let i = 1; i <= 5; i++) {
    await prisma.event.upsert({
      where: { id: i },
      update: {},
      create: {
        title: `Event${i}`,
        description: `Description for Event${i}`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)),
        classId: (i % 6) + 1,
      },
    });
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.upsert({
      where: { id: i },
      update: {},
      create: {
        title: `Announcement${i}`,
        description: `Description for Announcement${i}`,
        date: new Date(),
        classId: (i % 6) + 1,
      },
    });
  }

  console.log("All data seeded successfully");

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });