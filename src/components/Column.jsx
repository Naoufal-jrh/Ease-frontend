import { memo, useEffect, useRef, useState } from "react";
import Card, { CardShadow } from "./Card";
import { Copy, Ellipsis, Plus, XIcon } from "lucide-react";
import { blockBoardPanningAttr } from "@/utils/data-atributes";
import invariant from 'tiny-invariant';
import {
    getColumnData,
    isCardData,
    isCardDropTargetData,
    isColumnData,
    isDraggingACard,
    isDraggingAColumn,
} from "@/utils/data";
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { isSafari } from "@/utils/is-safari";
import { isShallowEqual } from "@/utils/is-shallow-equal";
import { useForm } from "react-hook-form";

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


export default function Column({ column, fetchBoard }) {
    const scrollableRef = useRef(null);
    const outerFullHeightRef = useRef(null);
    const headerRef = useRef(null);
    const innerRef = useRef(null);
    const [state, setState] = useState(idle);
    const [showAddCardForm, setShowAddCardForm] = useState(false);
    const {
        register,
        reset,
        handleSubmit,
    } = useForm()


    async function handleAdddCard(card) {
        const res = await fetch("http://localhost:8080/column/" + column.id,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    card
                )
            }
        )
        const data = await res.json();

        fetchBoard();
        reset();
        console.log(data);
    }

    const handleSubmitAddNewCard = (data) => {
        console.log(data)

        if (data.description === null || data.description.trim() === "") {
            console.log("empty description")
            setShowAddCardForm(false);
            return;
        }

        handleAdddCard(data);

    }




    useEffect(() => {
        const outer = outerFullHeightRef.current;
        const scrollable = scrollableRef.current;
        const header = headerRef.current;
        const inner = innerRef.current;

        invariant(outer);
        invariant(scrollable);
        invariant(header);
        invariant(inner);

        const data = getColumnData({ column });

        function setIsCardOver({ data, location }) {
            const innerMost = location.current.dropTargets[0];
            const isOverChildCard = Boolean(innerMost && isCardDropTargetData(innerMost.data));

            const proposed = {
                type: 'is-card-over',
                dragging: data.rect,
                isOverChildCard,
            };
            // optimization - don't update state if we don't need to.
            setState((current) => {
                if (isShallowEqual(proposed, current)) {
                    return current;
                }
                return proposed;
            });
        }

        return combine(
            // make columns draggable
            draggable({
                element: header,
                getInitialData: () => data,
                onGenerateDragPreview({ source, location, nativeSetDragImage }) {
                    const data = source.data;
                    invariant(isColumnData(data));
                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: preserveOffsetOnSource({ element: header, input: location.current.input }),
                        render({ container }) {
                            // Simple drag preview generation: just cloning the current element.
                            // Not using react for this.
                            const rect = inner.getBoundingClientRect();
                            const preview = inner.cloneNode(true);
                            invariant(preview instanceof HTMLElement);
                            preview.style.width = `${rect.width}px`;
                            preview.style.height = `${rect.height}px`;

                            // rotation of native drag previews does not work in safari
                            if (!isSafari()) {
                                preview.style.transform = 'rotate(4deg)';
                            }

                            container.appendChild(preview);
                        },
                    });
                },
                onDragStart() {
                    setState({ type: 'is-dragging' });
                },
                onDrop() {
                    setState(idle);
                },
            }),
            // make columns drop targets
            dropTargetForElements({
                element: outer,
                getData: () => data,
                canDrop({ source }) {
                    return isDraggingACard({ source }) || isDraggingAColumn({ source });
                },
                getIsSticky: () => true,
                onDragStart({ source, location }) {
                    if (isCardData(source.data)) {
                        setIsCardOver({ data: source.data, location });
                    }
                },
                onDragEnter({ source, location }) {
                    if (isCardData(source.data)) {
                        setIsCardOver({ data: source.data, location });
                        return;
                    }
                    if (isColumnData(source.data) && source.data.column.id !== column.id) {
                        setState({ type: 'is-column-over' });
                    }
                },
                onDropTargetChange({ source, location }) {
                    if (isCardData(source.data)) {
                        setIsCardOver({ data: source.data, location });
                        return;
                    }
                },
                onDragLeave({ source }) {
                    if (isColumnData(source.data) && source.data.column.id === column.id) {
                        return;
                    }
                    setState(idle);
                },
                onDrop({ source, self }) {
                    // console.log("Column's on drop was called")
                    setState(idle);

                    // if (isCardData(source.data)) {
                    //     console.log("Dropped card :", source.data.card);
                    //     console.log("Comes from column :", source.data.columnId);
                    //     console.log("Dropped on column", self.data.column);
                    // }

                    // if (isColumnData(source.data)) {
                    //     console.log("Dropped column :", source.data.column);
                    //     console.log("Comes from column :", source.data.columnId);
                    //     console.log("Dropped on column", self.data.column);
                    // }
                },
            }),
            autoScrollForElements({
                canScroll({ source }) {
                    // if (!settings.isOverElementAutoScrollEnabled) {
                    //     return false;
                    // }

                    return isDraggingACard({ source });
                },
                // getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
                element: scrollable,
            }),
            unsafeOverflowAutoScrollForElements({
                element: scrollable,
                // getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
                canScroll({ source }) {
                    // if (!settings.isOverElementAutoScrollEnabled) {
                    //     return false;
                    // }

                    // if (!settings.isOverflowScrollingEnabled) {
                    //     return false;
                    // }

                    return isDraggingACard({ source });
                },
                getOverflow() {
                    return {
                        forTopEdge: {
                            top: 1000,
                        },
                        forBottomEdge: {
                            bottom: 1000,
                        },
                    };
                },
            }),
        );
    }, [column]);



    return (
        <div className="flex w-72 flex-shrink-0 select-none flex-col" ref={outerFullHeightRef}>
            <div
                className={`flex max-h-full flex-col rounded-lg bg-slate-800 text-neutral-50 ${stateStyles[state.type]}`}
                ref={innerRef}
                {...{ [blockBoardPanningAttr]: true }}
            >
                {/* Extra wrapping element to make it easy to toggle visibility of content when a column is dragging over */}
                <div
                    className={`flex max-h-full flex-col ${state.type === 'is-column-over' ? 'invisible' : ''}`}
                >
                    <div className="flex flex-row items-center justify-between p-3 pb-2" ref={headerRef}>
                        <div className="pl-2 font-bold leading-4">{column.title}</div>
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
                                    <input type="text" placeholder="Enter a title for your card" {...register("description")} className="bg-slate-700 px-2 pt-2 pb-8 rounded" />
                                    <div className="flex items-center gap-3">
                                        <button type="submit" className="bg-blue-400 p-2 rounded font-medium text-black text-sm cursor-pointer">Add Card</button>
                                        <button onClick={() => setShowAddCardForm(false)} className="rounded p-2 hover:bg-slate-700 active:bg-slate-600 cursor-pointer">
                                            <XIcon size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                            :
                            <div className="flex flex-row gap-2 p-3">
                                <button
                                    type="button"
                                    className="flex flex-grow flex-row gap-1 rounded p-2 hover:bg-slate-700 active:bg-slate-600 cursor-pointer"
                                    onClick={() => setShowAddCardForm(true)}
                                >
                                    <Plus size={16} />
                                    <div className="leading-4">Add a card</div>
                                </button>
                                <button
                                    type="button"
                                    className="rounded p-2 hover:bg-slate-700 active:bg-slate-600 cursor-pointer"
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