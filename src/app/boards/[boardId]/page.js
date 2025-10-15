"use client"
import Board from "@/components/Board";
import { getBoardById } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import { useParams } from "next/navigation";


export default function BoardPage() {
    const params = useParams();
    const boardId = params.boardId;
    return (
        <Board boardId={boardId} />
    );
}
