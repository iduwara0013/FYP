import type { Metadata } from "next";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = {
  title: "Overview | AgriLanka Admin",
  description: "AgriLanka operations, users, crop plans, market data, and AI monitoring.",
};

export default function Home() {
  return <AdminDashboard />;
}
