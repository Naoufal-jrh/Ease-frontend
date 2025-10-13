"use client"
import Board from "@/components/Board";
import { getBoardById } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";


export default function BoardPage() {
    const params = useParams();
    const boardId = params.boardId;
    const [data, setData] = useState({});

    async function fetchBoard() {
        const data = await getBoardById(boardId)
        setData(data);
    }

    useEffect(() => {
        fetchBoard();
    }, []);

    return (
        <main className="p-6">
            {
                data.columns ? (
                    <Board data={data} setData={setData} fetchBoard={fetchBoard} />
                ) :
                    <div>loading...</div>
            }
        </main>
    );
}
