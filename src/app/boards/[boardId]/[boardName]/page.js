"use client"
import Board from "@/components/Board";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";


export default function BoardPage() {
    const params = useParams();
    const boardId = params.boardId;
    const [data, setData] = useState({});

    async function fetchBoard() {
        console.log("fetching board ...")
        const res = await fetch("http://localhost:8080/board/" + boardId);
        const data = await res.json();
        setData(data);
        console.log("data ", data)
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
