"use client"

import { useState } from "react";
import Column from "./Column";
import { Plus, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { addColumn, updateCards, updateColumns } from "@/lib/api";
import { useBoardDnD } from "@/hooks/useBoardDnD";

export default function Board({ data, setData, fetchBoard }) {
    const { scrollableRef } = useBoardDnD({ data, setData })
    const [showAddColumnForm, setShowAddColumnForm] = useState(false);
    const {
        handleSubmit,
        register,
        reset
    } = useForm();

    async function handleAddNewColumn(column) {
        await addColumn(data.id, column);
        fetchBoard();
        reset();
    }

    return (
        <div className={`flex h-full flex-col`}>
            <div
                className={`flex h-full flex-row gap-3 overflow-x-auto p-3 [scrollbar-color:theme(colors.slate.600)_theme(colors.slate.800)] [scrollbar-width:thin]`}
                ref={scrollableRef}
            >
                {data.columns.map((column) => (
                    <Column key={column.id} column={column} fetchBoard={fetchBoard} />
                ))}

                <div className="flex w-72 flex-shrink-0 select-none flex-col " >
                    {
                        showAddColumnForm
                            ?
                            <div className="flex mx-1 bg-white border-1 border-gray-200 text-neutral-50 rounded-lg ">
                                <form onSubmit={handleSubmit(handleAddNewColumn)} className="flex w-full flex-col gap-2 p-2">
                                    <input type="text" placeholder="Enter a title for your card" {...register("name")} className="bg-white text-black border-1 border-gray-200 px-2 py-2 rounded" />
                                    <div className="flex items-center gap-3">
                                        <button type="submit" className="bg-blue-400 p-2 rounded font-medium text-black text-sm cursor-pointer">Add List</button>
                                        <button onClick={() => setShowAddColumnForm(false)} className="rounded p-2 hover:bg-slate-700 active:bg-slate-600 cursor-pointer">
                                            <XIcon size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                            :
                            <button
                                className={`flex max-h-full flex-row gap-2 items-center p-2 rounded-lg bg-white text-slate-800 shadow-lg border-1 border-gray-200 hover:bg-slate-100 cursor-pointer`}
                                onClick={() => setShowAddColumnForm(true)}
                            >
                                <Plus size={18} />
                                Add another list
                            </button>
                    }
                </div>
            </div>
        </div>
    );
}