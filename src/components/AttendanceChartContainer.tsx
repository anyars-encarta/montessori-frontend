import { StudentAttendance, WeekdayAttendancePoint } from "@/types";
import AttendanceChart from "./AttendanceChart";

const getStudentAttendance = (attendances: StudentAttendance[]) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daySinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daySinceMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const resData: WeekdayAttendancePoint[] = attendances
    .filter((item) => {
      const date = new Date(item.attendanceDate);
      const itemDayOfWeek = date.getDay();
      const isWeekday = itemDayOfWeek >= 1 && itemDayOfWeek <= 5;
      return date >= lastMonday && isWeekday;
    })
    .map((item) => ({
      date: item.attendanceDate,
      present: item.status === "present",
    }));

  return { resData, dayOfWeek };
};

const AttendanceChartContainer = ({ attendances, roleColors }: { attendances: StudentAttendance[]; roleColors: string[] }) => {
  const { resData } = getStudentAttendance(attendances);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const attendanceMap: {[key: string] : { present: number; absent: number }} = {
    Mon: { present: 0, absent: 0 },
    Tue: { present: 0, absent: 0 },
    Wed: { present: 0, absent: 0 },
    Thu: { present: 0, absent: 0 },
    Fri: { present: 0, absent: 0 },
  };

  resData.forEach((item) => {
    const itemDate = new Date(item.date);
    const itemDayOfWeek = itemDate.getDay();
    if (itemDayOfWeek >= 1 && itemDayOfWeek <= 5) {
      const dayName = daysOfWeek[itemDayOfWeek - 1];
      if (item.present) {
        attendanceMap[dayName].present += 1;
      } else {
        attendanceMap[dayName].absent += 1;
      }
    }
  });

  const data = daysOfWeek.map((day) => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));

  return (
    <div className="shadow-xl dark:dark-gradient rounded-xl w-full h-full p-4">
      <AttendanceChart data={data} colors={roleColors} />
    </div>
  );
};

export default AttendanceChartContainer;
