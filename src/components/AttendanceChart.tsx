import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AttendanceChart = ({
  data, colors,
}: {
  data: { name: string; present: number; absent: number }[];
  colors: string[];
}) => {

  return (
      <ResponsiveContainer width="100%" height="90%">
        <BarChart width={500} height={300} data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "gray" }}
            tickLine={false}
          />
          <YAxis axisLine={false} tick={{ fill: "gray" }} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              borderColor: "black",
              backgroundColor: "black",
              color: "white",
            }}
          />
          <Legend
            align="left"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
          />
          <Bar
            dataKey="present"
            fill={colors[2]}
            activeBar={<Rectangle fill={colors[0]} stroke={colors[1]} />}
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />
          <Bar
            dataKey="absent"
            fill={colors[3]}
            activeBar={<Rectangle fill={colors[1]} stroke={colors[0]} />}
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
  );
};

export default AttendanceChart;
