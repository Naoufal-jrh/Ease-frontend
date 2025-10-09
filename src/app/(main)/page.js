"use client"

import Board from "@/components/Board";
import { CircuitBoard, Columns, Columns2, Columns2Icon, Kanban, KanbanIcon, KanbanSquare, KanbanSquareDashed, Layout, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  return (

    <div className="rounded-lg p-4 shadow-md text-center">
      <h1 className="font-semibold text-lg mb-2">Welcome to the home page !</h1>
      <p>Invite people to boards and cards, leave comments, add due dates, and we'll show the most important activity here.</p>
    </div>
  );
}
