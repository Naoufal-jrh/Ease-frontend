"use client"

import PopUp from "@/components/Popup";
import { Grid, Rows } from "lucide-react";
import { Borel } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function BoardsPage() {
    const [boards, setBoards] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { handleSubmit, register } = useForm();

    async function addBoard(board) {
        console.log("adding new board", board)
        const res = await fetch("http://localhost:8080/board", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(board)
        });
        const data = await res.json();
        console.log("board added", data)
        fetchBoards();
        setIsOpen(false);

    }

    async function fetchBoards() {
        const res = await fetch("http://localhost:8080/board")
        const data = await res.json();
        console.log("boards ", data);
        setBoards(data)
    }

    useEffect(() => {
        fetchBoards();
    }, []);
    return (
        <div className="p-5">
            <div className="flex flex-row justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-700 mt-6 mb-4">Boards</h2>
                {/* <button className="bg-blue-400 text-slate-700 font-medium px-4 py-1 rounded-lg cursor-pointer hover:bg-blue-500">Create</button> */}
                <PopUp isOpen={isOpen} setIsOpen={setIsOpen} buttonText="Create" title="Add new board" >
                    <form onSubmit={handleSubmit(addBoard)} className="flex flex-col gap-2 mt-5">
                        <label className="text-sm">Board name</label>
                        <input type="text" className="p-2 border-2 rounded-lg border-gray-200" {...register("name")} />
                        <button type="submit" className="bg-blue-400 text-slate-700 font-medium px-4 py-1 rounded-lg cursor-pointer hover:bg-blue-500">Create</button>
                    </form>
                </PopUp>
            </div>
            <Header />
            <div className="grid grid-cols-4 gap-4">
                {
                    boards.map((board) => <BoardCard key={board.id} boardName={board.name} boardId={board.id} />)
                }
            </div>
        </div>
    )
}

function BoardCard({ boardName, boardId }) {
    return (
        <Link href={"/boards/" + boardId + "/" + boardName.replace(" ", "-")}>
            <div className="flex flex-col shadow rounded-lg hover:shadow-lg cursor-pointer">
                <div className="h-20 w-full rounded-t-lg bg-linear-to-r  hover:bg-linear-to-l from-orange-500 to-orange-700" />
                <div className="h-15 p-2 font-medium">
                    {boardName}
                </div>
            </div>
        </Link>
    );
}


function Header() {
    return (
        <div className="flex flex-row justify-between items-center mb-6">
            <div className="flex flex-row gap-4 items-center">
                <Grid color="black" />
                <Rows color="gray" />
            </div>
            <div className="flex flex-row gap-5 items-center">
                <div className="flex flex-col p-2">
                    <span className="text-sm text-neutral-500">Label</span>
                    <select className="text-sm font-semibold">
                        <option default>select label</option>
                        <option>Lable 1</option>
                        <option>Lable 2</option>
                        <option>Lable 3</option>
                        <option>Lable 4</option>
                    </select>
                </div>
                <div className="flex flex-col p-2">
                    <span className="text-sm text-neutral-500">Category</span>
                    <select className="text-sm font-semibold">
                        <option default>select label</option>
                        <option>Lable 1</option>
                        <option>Lable 2</option>
                        <option>Lable 3</option>
                        <option>Lable 4</option>
                    </select>
                </div>
                <div className="flex flex-col p-2">
                    <span className="text-sm text-neutral-500">Sort</span>
                    <select className="text-sm font-semibold">
                        <option default>select label</option>
                        <option>Lable 1</option>
                        <option>Lable 2</option>
                        <option>Lable 3</option>
                        <option>Lable 4</option>
                    </select>
                </div>
            </div>
        </div>
    );
}