/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const FinanceChart = ({fees, payments}: {fees: any, payments: any}) => {
  console.log("studentFees", fees);
  console.log("studentPayments", payments);
  
  const data = [
    {
      name: "Jan",
      payments: payments[0]?.total || 0,
      fees: fees[0]?.total || 0,
    },
    {
      name: "Feb",
      payments: payments[1]?.total || 0,
      fees: fees[1]?.total || 0,
    },
    {
      name: "Mar",
      payments: payments[2]?.total || 0,
      fees: fees[2]?.total || 0,
    },
    {
      name: "Apr",
      payments: payments[3]?.total || 0,
      fees: fees[3]?.total || 0,
    },
    {
      name: "May",
      payments: payments[4]?.total || 0,
      fees: fees[4]?.total || 0,
    },
    {
      name: "Jun",
      payments: payments[5]?.total || 0,
      fees: fees[5]?.total || 0,
    },
    {
      name: "Jul",
      payments: payments[6]?.total || 0,
      fees: fees[6]?.total || 0,
    },
    {
      name: "Aug",
      payments: payments[7]?.total || 0,
      fees: fees[7]?.total || 0,
    },
    {
      name: "Sep",
      payments: payments[8]?.total || 0,
      fees: fees[8]?.total || 0,
    },
    {
      name: "Oct",
      payments: payments[9]?.total || 0,
      fees: fees[9]?.total || 0,
    },
    {
      name: "Nov",
      payments: payments[10]?.total || 0,
      fees: fees[10]?.total || 0,
    },
    {
      name: "Dec",
      payments: payments[11]?.total || 0,
      fees: fees[11]?.total || 0,
    },
  ];

  return (
    <div className="shadow-xl dark:dark-gradient rounded-xl w-full h-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          Finance
        </h1>
      </div>
      <ResponsiveContainer width="100%" height="98%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "gray" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "gray" }}
            tickLine={false}
            tickMargin={20}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              borderColor: "black",
              backgroundColor: "black",
              color: "white",
            }}
          />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line
            type="monotone"
            dataKey="payments"
            stroke="#82ca9d"
            strokeWidth={5}
          />
          <Line
            type="monotone"
            dataKey="fees"
            stroke="#EFBF04"
            strokeWidth={5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;
