'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Bell, Home, KanbanIcon, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({ children }) {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };


  const linkBase =
    "flex flex-row gap-4 items-center p-2 rounded-lg transition-colors duration-150";
  const activeClass = "bg-blue-400";
  const inactiveClass = "hover:bg-blue-100 text-slate-700";


  return (
    <div className="flex flex-row px-20 py-8">
      <aside className="w-[20%] flex flex-col gap-2">
        <Link href={"/boards"}>
          <div className={`${linkBase} ${isActive("/boards") ? activeClass : inactiveClass}`}>
            <KanbanIcon size={16} strokeWidth={3} />
            <span className="font-medium text-slate-700 text-[15px]">Boards</span>
          </div>

        </Link>
        <Link href={"/"} >
          <div className={`${linkBase} ${isActive("/") ? activeClass : inactiveClass}`}>
            <Home size={16} strokeWidth={3} />
            <span className="font-medium text-slate-700 text-[15px]">Home</span>
          </div>
        </Link>
      </aside>
      <main className="w-[80%] px-15">
        {children}
      </main>
    </div>

  );
}
