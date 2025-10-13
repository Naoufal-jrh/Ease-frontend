import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isSafari } from "@/utils/is-safari";
import { useCardDnD } from "@/hooks/useCardDnD";



const idle = { type: 'idle' };

const innerStyles = {
    idle: 'hover:outline-2 outline-neutral-50 cursor-grab',
    'is-dragging': 'opacity-40',
};

const outerStyles = {
    // We no longer render the draggable item after we have left it
    // as it's space will be taken up by a shadow on adjacent items.
    // Using `display:none` rather than returning `null` so we can always
    // return refs from this component.
    // Keeping the refs allows us to continue to receive events during the drag.
    'is-dragging-and-left-self': 'hidden',
};


export function CardShadow({ dragging }) {
    return <div className="flex-shrink-0 rounded bg-slate-200" style={{ height: dragging.height }} />;
}

export function CardDisplay({
    card,
    state,
    outerRef,
    innerRef,
}) {
    return (
        <div
            ref={outerRef}
            className={`flex flex-shrink-0 flex-col gap-2 px-3 py-1 ${outerStyles[state.type]}`}
        >
            {/* Put a shadow before the item if closer to the top edge */}
            {state.type === 'is-over' && state.closestEdge === 'top' ? (
                <CardShadow dragging={state.dragging} />
            ) : null}
            <div
                className={`rounded bg-slate-100 p-2 text-slate-800 ${innerStyles[state.type]}`}
                ref={innerRef}
                style={
                    state.type === 'preview'
                        ? {
                            width: state.dragging.width,
                            height: state.dragging.height,
                            transform: !isSafari() ? 'rotate(4deg)' : undefined,
                        }
                        : undefined
                }
            >
                <div>{card.description}</div>
            </div>
            {/* Put a shadow after the item if closer to the bottom edge */}
            {state.type === 'is-over' && state.closestEdge === 'bottom' ? (
                <CardShadow dragging={state.dragging} />
            ) : null}
        </div>
    );
}

export default function Card({ card, columnId }) {
    const [state, setState] = useState(idle);
    const { outerRef, innerRef } = useCardDnD({ card, columnId, setState, idle })

    return (
        <>
            <CardDisplay outerRef={outerRef} innerRef={innerRef} state={state} card={card} />
            {state.type === 'preview'
                ? createPortal(<CardDisplay state={state} card={card} />, state.container)
                : null}
        </>
    );
}