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
  const activeClass = "bg-brand-primary text-black";
  const inactiveClass = "hover:bg-brand-secondary text-gray-500";


  return (
    <div className="flex flex-row p-10 md:px-20 md:py-8 gap-10">
      <aside className="w-[20%] flex-col gap-2 max-w-[20rem] min-w-[15rem] hidden sm:flex">
        <Link href={"/boards"}>
          <div className={`${linkBase} ${isActive("/boards") ? activeClass : inactiveClass}`}>
            <KanbanIcon size={16} strokeWidth={3} />
            <span className="font-medium text-[15px]">Boards</span>
          </div>

        </Link>
        <Link href={"/"} >
          <div className={`${linkBase} ${isActive("/") ? activeClass : inactiveClass}`}>
            <Home size={16} strokeWidth={3} />
            <span className="font-medium text-[15px]">Home</span>
          </div>
        </Link>
      </aside>
      <main className="w-full flex justify-center">
        {children}
      </main>
    </div>

  );
}
