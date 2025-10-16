"use client"

import PopUp from "@/components/Popup";
import { addBoard, getBoards } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid, LoaderPinwheel, Rows } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function BoardsPage() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const { handleSubmit, register, reset } = useForm();

    const mutation = useMutation({
        mutationFn: (board) => addBoard(board),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['boards'] })
            const previousBoards = queryClient.getQueryData(['boards'])
            queryClient.setQueryData(['boards'], (old) => old.concat({ id: -1, ...data }))
            return { previousBoards }
        },
        onError: (error, context) => {
            console.log("an error accured", error)
            queryClient.setQueryData(['boars'], context.previousBoards)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] })
        },
    })
    const { data: boards, isPending } = useQuery({
        queryKey: ['boards'],
        queryFn: getBoards
    })

    async function handleAddBoard(board) {
        mutation.mutate(board)
        setIsOpen(false);
        reset();
    }

    return (
        <div className="px-5 w-full max-w-[100rem]">
            <div className="flex flex-row justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-700 mt-6 mb-4">Boards</h2>
                <PopUp isOpen={isOpen} setIsOpen={setIsOpen} buttonText="Create" title="Add new board" >
                    <form onSubmit={handleSubmit(handleAddBoard)} className="flex flex-col gap-2 mt-5">
                        <label className="text-sm">Board name</label>
                        <input type="text" className="p-2 border-2 rounded-lg border-gray-200" {...register("name")} />
                        <button type="submit" className="bg-blue-400 text-slate-700 font-medium px-4 py-1 rounded-lg cursor-pointer hover:bg-blue-500">Create</button>
                    </form>
                </PopUp>
            </div>
            <Header />
            {
                isPending ? <div className="w-full py-10 flex justify-center items-center">
                    <LoaderPinwheel />
                </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {
                        boards.map((board) => <BoardCard key={board.id} boardName={board.name} boardId={board.id} />)
                    }
                </div>
            }
        </div>
    )
}

function BoardCard({ boardName, boardId }) {
    return (
        <Link href={"/boards/" + boardId}>
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
        <div className="flex-row justify-between items-center mb-6 hidden lg:flex">
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