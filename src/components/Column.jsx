import { memo, useEffect, useRef, useState } from "react";
import Card, { CardShadow } from "./Card";
import { Columns, Copy, Ellipsis, Plus, XIcon } from "lucide-react";
import { blockBoardPanningAttr } from "@/utils/data-atributes";
import { useForm } from "react-hook-form";
import { addCard } from "@/lib/api";
import { useColumnDnD } from "@/hooks/useColumnDnD";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const stateStyles = {
    idle: 'cursor-grab',
    'is-card-over': 'outline outline-2 outline-neutral-50',
    'is-dragging': 'opacity-40',
    'is-column-over': 'bg-slate-900',
};

const idle = { type: 'idle' };

const CardList = memo(function CardList({ column }) {
    return column.cards.map((card) => <Card key={card.id} card={card} columnId={column.id} />);
});


export default function Column({ column, boardId }) {
    const [state, setState] = useState(idle);
    const [showAddCardForm, setShowAddCardForm] = useState(false);
    const {
        scrollableRef,
        outerFullHeightRef,
        headerRef,
        innerRef
    } = useColumnDnD({ column, setState, idle })
    const {
        register,
        reset,
        handleSubmit,
    } = useForm()

    const queryClient = useQueryClient()


    const mutation = useMutation({
        mutationFn: (card) => addCard(column.id, card),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['board', boardId] });
            const previousBoard = queryClient.getQueryData(['board', boardId]);
            queryClient.setQueryData(['board', boardId], old => {
                if (!old) return old;

                return {
                    ...old,
                    columns: old.columns.map(col => {
                        if (col.id === column.id) {
                            return {
                                ...col,
                                cards: [...col.cards, {
                                    id: -1,
                                    ...data
                                }],
                            };
                        }
                        return col;
                    }),
                }
            });
            return { previousBoard }
        },
        onError: (error, context) => {
            // TODO: show an error message 
            console.log("an error occured", error);
            queryClient.setQueryData(['board', boardId], context.previousBoard);
        },
        onSettled: () => {
            // instead of revalidating you can just get the new added board and add it instead
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
        }
    })

    async function handleAddCard(card) {
        mutation.mutate(card)
        reset();
    }

    const handleSubmitAddNewCard = (data) => {
        if (data.description === null || data.description.trim() === "") {
            console.log("empty description")
            setShowAddCardForm(false);
            return;
        }
        handleAddCard(data);
    }

    return (
        <div className="flex w-72 flex-shrink-0 select-none flex-col" ref={outerFullHeightRef}>
            <div
                className={`flex max-h-full flex-col rounded-lg bg-white text-slate-800 shadow-xl border-1 border-gray-200 ${stateStyles[state.type]}`}
                ref={innerRef}
                {...{ [blockBoardPanningAttr]: true }}
            >
                {/* Extra wrapping element to make it easy to toggle visibility of content when a column is dragging over */}
                <div
                    className={`flex max-h-full flex-col ${state.type === 'is-column-over' ? 'invisible' : ''}`}
                >
                    <div className="flex flex-row items-center justify-between p-3 pb-2" ref={headerRef}>
                        <div className="pl-2 font-bold leading-4">{column.name}</div>
                        <button
                            type="button"
                            className="rounded p-2 hover:bg-slate-700 active:bg-slate-600"
                            aria-label="More actions"
                        >
                            <Ellipsis size={16} />
                        </button>
                    </div>
                    <div
                        className="flex flex-col overflow-y-auto [overflow-anchor:none] [scrollbar-color:theme(colors.slate.600)_theme(colors.slate.700)] [scrollbar-width:thin]"
                        ref={scrollableRef}
                    >
                        <CardList column={column} />
                        {state.type === 'is-card-over' && !state.isOverChildCard ? (
                            <div className="flex-shrink-0 px-3 py-1">
                                <CardShadow dragging={state.dragging} />
                            </div>
                        ) : null}
                    </div>
                    {
                        showAddCardForm
                            ?
                            <div className="flex mx-1 ">
                                <form onSubmit={handleSubmit(handleSubmitAddNewCard)} className="flex w-full flex-col gap-2 p-2">
                                    <input type="text" placeholder="Enter a title for your card" {...register("description")} className="bg-white border-1 border-gray-200 px-2 pt-2 pb-8 rounded" />
                                    <div className="flex items-center gap-3">
                                        <button type="submit" className="bg-blue-400 p-2 rounded font-medium text-black text-sm cursor-pointer">Add Card</button>
                                        <button onClick={() => setShowAddCardForm(false)} className="rounded p-2 hover:bg-slate-200 active:bg-slate-100 cursor-pointer">
                                            <XIcon size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                            :
                            <div className="flex flex-row gap-2 p-3">
                                <button
                                    type="button"
                                    className="flex flex-grow flex-row gap-1 rounded p-2 hover:bg-slate-200 active:bg-slate-100 cursor-pointer"
                                    onClick={() => setShowAddCardForm(true)}
                                >
                                    <Plus size={16} />
                                    <div className="leading-4">Add a card</div>
                                </button>
                                <button
                                    type="button"
                                    className="rounded p-2 hover:bg-slate-200 active:bg-slate-100 cursor-pointer"
                                    aria-label="Create card from template"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                    }
                </div>
            </div>
        </div>
    );
}