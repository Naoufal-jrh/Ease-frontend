import { useEffect, useRef } from "react";
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






export function useColumnDnD({ column, setState, idle }) {
    const scrollableRef = useRef(null);
    const outerFullHeightRef = useRef(null);
    const headerRef = useRef(null);
    const innerRef = useRef(null);


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
                    setState(idle);
                },
            }),
            autoScrollForElements({
                canScroll({ source }) {
                    return isDraggingACard({ source });
                },
                element: scrollable,
            }),
            unsafeOverflowAutoScrollForElements({
                element: scrollable,
                canScroll({ source }) {
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

    return {
        scrollableRef,
        outerFullHeightRef,
        headerRef,
        innerRef
    };
}