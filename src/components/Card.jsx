import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import invariant from 'tiny-invariant';
import {
    attachClosestEdge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { getCardData, getCardDropTargetData, isCardData, isColumnData, isDraggingACard, TCard } from "@/utils/data";
import { isShallowEqual } from "@/utils/is-shallow-equal";
import { isSafari } from "@/utils/is-safari";



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
    const outerRef = useRef(null);
    const innerRef = useRef(null);
    const [state, setState] = useState(idle);



    useEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        invariant(outer && inner);

        return combine(
            draggable({
                element: inner,
                getInitialData: ({ element }) =>
                    getCardData({ card, columnId, rect: element.getBoundingClientRect() }),
                onGenerateDragPreview({ nativeSetDragImage, location, source }) {
                    const data = source.data;
                    invariant(isCardData(data));
                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: preserveOffsetOnSource({ element: inner, input: location.current.input }),
                        render({ container }) {
                            // Demonstrating using a react portal to generate a preview
                            setState({
                                type: 'preview',
                                container,
                                dragging: inner.getBoundingClientRect(),
                            });
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
            dropTargetForElements({
                element: outer,
                getIsSticky: () => true,
                canDrop: isDraggingACard,
                getData: ({ element, input }) => {
                    const data = getCardDropTargetData({ card, columnId });
                    return attachClosestEdge(data, { element, input, allowedEdges: ['top', 'bottom'] });
                },
                onDragEnter({ source, self }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.card.id === card.id) {
                        return;
                    }
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) {
                        return;
                    }

                    setState({ type: 'is-over', dragging: source.data.rect, closestEdge });
                },
                onDrag({ source, self }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.card.id === card.id) {
                        return;
                    }
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) {
                        return;
                    }
                    // optimization - Don't update react state if we don't need to.
                    const proposed = { type: 'is-over', dragging: source.data.rect, closestEdge };
                    setState((current) => {
                        if (isShallowEqual(proposed, current)) {
                            return current;
                        }
                        return proposed;
                    });
                },
                onDragLeave({ source }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.card.id === card.id) {
                        setState({ type: 'is-dragging-and-left-self' });
                        return;
                    }
                    setState(idle);
                },
                onDrop({ source, self }) {
                    setState(idle);
                    // if (isCardData(source.data)) {
                    //     // when changing cards order within the same column or different column
                    //     // need :
                    //     //      movedCardColumnId
                    //     //      movedCardId
                    //     //      dropedOnCardColumnId
                    //     //      dropedOnCardId
                    //     console.log("moved card column Id", source.data.columnId)
                    //     console.log("moved card Id", source.data.card.id)
                    //     console.log("droped on card column Id", self.data.columnId)
                    //     console.log("droped on card column Id", self.data.card.id)
                    // }
                },
            }),
        );
    }, [card, columnId]);
    return (
        <>
            <CardDisplay outerRef={outerRef} innerRef={innerRef} state={state} card={card} />
            {state.type === 'preview'
                ? createPortal(<CardDisplay state={state} card={card} />, state.container)
                : null}
        </>
    );
}