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

  // EXAM - Create exams for existing lessons
  const existingLessons = await prisma.lesson.findMany({
    select: { id: true },
    take: 10
  });

  for (let i = 0; i < Math.min(10, existingLessons.length); i++) {
    await prisma.exam.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        title: `Exam${i + 1}`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)),
        lessonId: existingLessons[i].id,
      },
    });
  }

  // ASSIGNMENT - Create assignments for existing lessons
  const assignmentLessons = await prisma.lesson.findMany({
    select: { id: true, subjectId: true },
    take: 10
  });

  for (let i = 0; i < Math.min(10, assignmentLessons.length); i++) {
    await prisma.assignment.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        title: `Assignment${i + 1}`,
        startDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        subjectId: assignmentLessons[i].subjectId,
        lessonId: assignmentLessons[i].id,
      },
    });
  }

  // RESULT - Create results for existing exams and assignments
  const existingExams = await prisma.exam.findMany({
    select: { id: true },
    take: 10
  });

  const existingAssignments = await prisma.assignment.findMany({
    select: { id: true },
    take: 10
  });

  const existingStudents = await prisma.student.findMany({
    select: { id: true },
    take: 10
  });

  for (let i = 0; i < Math.min(10, existingExams.length, existingAssignments.length, existingStudents.length); i++) {
    await prisma.result.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        score: Math.floor(Math.random() * 100) + 1,
        examId: existingExams[i].id,
        assignmentId: existingAssignments[i].id,
        studentId: existingStudents[i].id,
      },
    });
  }

  // ATTENDANCE - Create comprehensive attendance for current week
  const today = new Date();
  let attendanceId = 1;

  // Calculate Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

  // Get all lessons to create attendance for each lesson
  const lessons = await prisma.lesson.findMany({
    select: { id: true, classId: true }
  });

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) { // Mon to Fri
    const attendanceDate = new Date(monday);
    attendanceDate.setDate(monday.getDate() + dayOffset);

    // For each lesson on this day, create attendance for all students in that class
    for (const lesson of lessons) {
      // Get students in this class
      const studentsInClass = await prisma.student.findMany({
        where: { classId: lesson.classId },
        select: { id: true }
      });

      for (const student of studentsInClass) {
        // Create attendance with varying presence rates
        const isPresent = Math.random() > 0.15; // 85% present rate

        await prisma.attendance.upsert({
          where: { id: attendanceId },
          update: {},
          create: {
            date: attendanceDate,
            present: isPresent,
            studentId: student.id,
            lessonId: lesson.id,
          },
        });
        attendanceId++;
      }
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

  // ANNOUNCEMENT - Enhanced with more detailed and varied announcements
  const announcementsData = [
    {
      title: "Welcome Back to School!",
      description: "We hope everyone had a great summer break. Let's make this academic year amazing!",
      date: new Date(),
      classId: null, // School-wide announcement
    },
    {
      title: "Parent-Teacher Meeting",
      description: "PTM scheduled for next Friday at 2:00 PM. All parents are requested to attend.",
      date: new Date(),
      classId: 1,
    },
    {
      title: "Science Fair Registration Open",
      description: "Register your innovative science projects by next week. Prizes for winners!",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      classId: null,
    },
    {
      title: "Mathematics Olympiad",
      description: "Students interested in Math Olympiad, please contact your math teacher.",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      classId: 2,
    },
    {
      title: "Sports Day Postponed",
      description: "Due to weather conditions, Sports Day has been postponed to next month.",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      classId: null,
    },
    {
      title: "Library Books Due",
      description: "All library books must be returned by Friday. Late fees will apply.",
      date: new Date(),
      classId: 3,
    },
    {
      title: "New Computer Lab",
      description: "Exciting news! Our new computer lab is now open for all students.",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      classId: null,
    },
    {
      title: "Class 5A Field Trip",
      description: "Field trip to the Science Museum next Tuesday. Permission slips due by Monday.",
      date: new Date(),
      classId: 5,
    },
  ];

  for (let i = 0; i < announcementsData.length; i++) {
    await prisma.announcement.upsert({
      where: { id: i + 1 },
      update: {},
      create: announcementsData[i],
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