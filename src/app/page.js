"use client"

import Board from "@/components/Board";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState({});
  const boardId = 1;

  async function fetchBoard() {
    console.log("fetching board ...")
    const res = await fetch("http://localhost:8080/board/" + boardId);
    const data = await res.json();
    setData(data);
  }

  useEffect(() => {
    fetchBoard();
  }, []);
  return (
    <div>
      <header className="flex flex-row justify-between items-center bg-zinc-900 px-20 py-3">
        <h4 className="text-md font-bold text-gray-300">Trello Lite</h4>
        <div className="bg-gray-200 p-2 rounded-full font-bold text-gray-500 text-xs">NJ</div>
      </header>
      <nav className="px-20 py-5 bg-amber-800">
        <h3 className="text-white font-bold text-lg">Project Name</h3>
      </nav>
      <main>
        {
          data.columns ? (
            <Board data={data} setData={setData} fetchBoard={fetchBoard} />
          ) :
            <div>loading...</div>
        }
      </main>
    </div>
  );
}
