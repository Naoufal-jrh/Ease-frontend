import { useEffect, useRef } from "react";

import invariant from "tiny-invariant";

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';

import { bindAll } from 'bind-event-listener';

import {
    isCardData,
    isCardDropTargetData,
    isColumnData,
    isDraggingACard,
    isDraggingAColumn,
} from "@/utils/data";
import { blockBoardPanningAttr } from "@/utils/data-atributes";
import { updateCards, updateColumns } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export function useBoardDnD({ boardId }) {
    const scrollableRef = useRef(null)
    const queryClient = useQueryClient();

    const cardsMutation = useMutation({
        mutationFn: ({ columnId, cards }) => updateCards(columnId, cards),
        onMutate: (data) => {
            queryClient.cancelQueries({ queryKey: ['board', boardId] })
            const previousBoard = queryClient.getQueryData({ queryKey: ['board', boardId] })
            queryClient.setQueryData(['board', boardId], (old) => {
                // replace the cards of the column with the new cards
                if (!old) return old;
                const res = {
                    ...old,
                    columns: old.columns.map((column) => {
                        if (column.id === data.columnId) return {
                            ...column,
                            cards: data.cards
                        };
                        return column;
                    })
                }
                return res
            });
            return { previousBoard }
        },
        onError: (error, context) => {
            console.log("an error was throwen", error)
            queryClient.setQueryData(['board', boardId], context.previousBoard)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
        }
    });

    const columnsMutation = useMutation({
        mutationFn: (columns) => updateColumns(boardId, columns),
        onMutate: (data) => {
            console.log("columns mutation data : ", data)
            queryClient.cancelQueries({ queryKey: ['board', boardId] })
            const previousBoard = queryClient.getQueryData({ queryKey: ['board', boardId] })
            queryClient.setQueryData(['board', boardId], (old) => {
                // replace the cards of the column with the new cards
                if (!old) return old;
                const res = {
                    ...old,
                    columns: data
                }
                console.log("columns res : ", res)
                return res;
            });
            return { previousBoard }
        },
        onError: (error, context) => {
            console.log("an error was throwen", error)
            queryClient.setQueryData(['board', boardId], context.previousBoard)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
        }
    })

    function updateCardsList(columnId, cards) {
        // await updateCards(columnId, cards);
        cardsMutation.mutate({ columnId, cards });
    }

    function updateColumnsList(columns) {
        columnsMutation.mutate(columns);
        // await updateColumns(queryClient.getQueryData(['board', boardId]).id, columns)
    }

    useEffect(() => {
        const element = scrollableRef.current;
        invariant(element);
        return combine(
            // monitoring Cards in the board
            monitorForElements({
                canMonitor: isDraggingACard,
                onDrop({ source, location }) {
                    const dragging = source.data;
                    if (!isCardData(dragging)) {
                        return;
                    }

                    const innerMost = location.current.dropTargets[0];

                    if (!innerMost) {
                        return;
                    }
                    const dropTargetData = innerMost.data;
                    const homeColumnIndex = queryClient.getQueryData(['board', boardId]).columns.findIndex(
                        (column) => column.id === dragging.columnId,
                    );
                    const home = queryClient.getQueryData(['board', boardId]).columns[homeColumnIndex];

                    if (!home) {
                        return;
                    }
                    const cardIndexInHome = home.cards.findIndex((card) => card.id === dragging.card.id);

                    // dropping on a card
                    if (isCardDropTargetData(dropTargetData)) {
                        const destinationColumnIndex = queryClient.getQueryData(['board', boardId]).columns.findIndex(
                            (column) => column.id === dropTargetData.columnId,
                        );
                        const destination = queryClient.getQueryData(['board', boardId]).columns[destinationColumnIndex];
                        // reordering in home column
                        if (home === destination) {
                            const cardFinishIndex = home.cards.findIndex(
                                (card) => card.id === dropTargetData.card.id,
                            );

                            // could not find cards needed
                            if (cardIndexInHome === -1 || cardFinishIndex === -1) {
                                return;
                            }

                            // no change needed
                            if (cardIndexInHome === cardFinishIndex) {
                                return;
                            }

                            const closestEdge = extractClosestEdge(dropTargetData);

                            const reordered = reorderWithEdge({
                                axis: 'vertical',
                                list: home.cards,
                                startIndex: cardIndexInHome,
                                indexOfTarget: cardFinishIndex,
                                closestEdgeOfTarget: closestEdge,
                            });

                            const updated = {
                                ...home,
                                cards: reordered,
                            };
                            const columns = Array.from(queryClient.getQueryData(['board', boardId]).columns);
                            columns[homeColumnIndex] = updated;
                            // save the new order in the backend
                            updateCardsList(home.id, reordered.map(({ id, description }) => ({ id, description })));
                            // queryClient.setQueryData(['board', boardId], { ...queryClient.getQueryData(['board', boardId]), columns })
                            return;
                        }

                        // moving card from one column to another

                        // unable to find destination
                        if (!destination) {
                            return;
                        }

                        const indexOfTarget = destination.cards.findIndex(
                            (card) => card.id === dropTargetData.card.id,
                        );

                        const closestEdge = extractClosestEdge(dropTargetData);
                        const finalIndex = closestEdge === 'bottom' ? indexOfTarget + 1 : indexOfTarget;

                        // remove card from home list
                        const homeCards = Array.from(home.cards);
                        homeCards.splice(cardIndexInHome, 1);

                        // insert into destination list
                        const destinationCards = Array.from(destination.cards);
                        destinationCards.splice(finalIndex, 0, dragging.card);

                        const columns = Array.from(queryClient.getQueryData(['board', boardId]).columns);
                        columns[homeColumnIndex] = {
                            ...home,
                            cards: homeCards,
                        };
                        columns[destinationColumnIndex] = {
                            ...destination,
                            cards: destinationCards,
                        };
                        // save the changes to the backend
                        updateCardsList(home.id, homeCards);
                        updateCardsList(destination.id, destinationCards);

                        // queryClient.setQueryData(['board', boardId], { ...queryClient.getQueryData(['board', boardId]), columns })
                        return;
                    }

                    // dropping onto a column, but not onto a card
                    if (isColumnData(dropTargetData)) {
                        const destinationColumnIndex = queryClient.getQueryData(['board', boardId]).columns.findIndex(
                            (column) => column.id === dropTargetData.column.id,
                        );
                        const destination = queryClient.getQueryData(['board', boardId]).columns[destinationColumnIndex];

                        if (!destination) {
                            return;
                        }

                        // dropping on home
                        if (home === destination) {
                            console.log('moving card to home column');

                            // move to last position
                            const reordered = reorder({
                                list: home.cards,
                                startIndex: cardIndexInHome,
                                finishIndex: home.cards.length - 1,
                            });

                            const updated = {
                                ...home,
                                cards: reordered,
                            };
                            const columns = Array.from(queryClient.getQueryData(['board', boardId]).columns);
                            columns[homeColumnIndex] = updated;

                            queryClient.setQueryData({ ...queryClient.getQueryData(['board', boardId]), columns })
                            return;
                        }

                        console.log('moving card to another column');

                        // remove card from home list

                        const homeCards = Array.from(home.cards);
                        homeCards.splice(cardIndexInHome, 1);

                        // insert into destination list
                        const destinationCards = Array.from(destination.cards);
                        destinationCards.splice(destination.cards.length, 0, dragging.card);

                        const columns = Array.from(queryClient.getQueryData(['board', boardId]).columns);
                        columns[homeColumnIndex] = {
                            ...home,
                            cards: homeCards,
                        };
                        columns[destinationColumnIndex] = {
                            ...destination,
                            cards: destinationCards,
                        };
                        // save the changes to the backend
                        updateCardsList(home.id, homeCards)
                        updateCardsList(destination.id, destinationCards)
                        // queryClient.setQueryData(['board', boardId], { ...queryClient.getQueryData(['board', boardId]), columns })
                        return;
                    }
                },
            }),
            // monitoring Columns in the board
            monitorForElements({
                canMonitor: isDraggingAColumn,
                onDrop({ source, location }) {
                    const dragging = source.data;
                    if (!isColumnData(dragging)) {
                        return;
                    }

                    const innerMost = location.current.dropTargets[0];

                    if (!innerMost) {
                        return;
                    }
                    const dropTargetData = innerMost.data;

                    if (!isColumnData(dropTargetData)) {
                        return;
                    }

                    const homeIndex = queryClient.getQueryData(['board', boardId]).columns.findIndex((column) => column.id === dragging.column.id);
                    const destinationIndex = queryClient.getQueryData(['board', boardId]).columns.findIndex(
                        (column) => column.id === dropTargetData.column.id,
                    );

                    if (homeIndex === -1 || destinationIndex === -1) {
                        return;
                    }

                    if (homeIndex === destinationIndex) {
                        return;
                    }

                    const reordered = reorder({
                        list: queryClient.getQueryData(['board', boardId]).columns,
                        startIndex: homeIndex,
                        finishIndex: destinationIndex,
                    });
                    // save the new order to the backend
                    updateColumnsList(reordered)
                    // queryClient.setQueryData(['board', boardId], { ...queryClient.getQueryData(['board', boardId]), columns: reordered });
                },
            }),
            // handling horizontal scrolling
            autoScrollForElements({
                canScroll({ source }) {
                    return isDraggingACard({ source }) || isDraggingAColumn({ source });
                },
                element,
            }),
            // handle columns overflow for scroll
            unsafeOverflowAutoScrollForElements({
                element,
                canScroll({ source }) {
                    return isDraggingACard({ source }) || isDraggingAColumn({ source });
                },
                getOverflow() {
                    return {
                        forLeftEdge: {
                            top: 1000,
                            left: 1000,
                            bottom: 1000,
                        },
                        forRightEdge: {
                            top: 1000,
                            right: 1000,
                            bottom: 1000,
                        },
                    };
                },
            }),
        );
    }, [queryClient.getQueryData(['board', boardId])]);

    // Panning the board
    useEffect(() => {
        let cleanupActive = null;
        const scrollable = scrollableRef.current;
        invariant(scrollable);

        function begin({ startX }) {
            let lastX = startX;

            const cleanupEvents = bindAll(
                window,
                [
                    {
                        type: 'pointermove',
                        listener(event) {
                            const currentX = event.clientX;
                            const diffX = lastX - currentX;

                            lastX = currentX;
                            scrollable?.scrollBy({ left: diffX });
                        },
                    },
                    // stop panning if we see any of these events
                    ...(
                        [
                            'pointercancel',
                            'pointerup',
                            'pointerdown',
                            'keydown',
                            'resize',
                            'click',
                            'visibilitychange',
                        ]
                    ).map((eventName) => ({ type: eventName, listener: () => cleanupEvents() })),
                ],
                // need to make sure we are not after the "pointerdown" on the scrollable
                // Also this is helpful to make sure we always hear about events from this point
                { capture: true },
            );

            cleanupActive = cleanupEvents;
        }

        const cleanupStart = bindAll(scrollable, [
            {
                type: 'pointerdown',
                listener(event) {
                    if (!(event.target instanceof HTMLElement)) {
                        return;
                    }
                    // ignore interactive elements
                    if (event.target.closest(`[${blockBoardPanningAttr}]`)) {
                        return;
                    }

                    begin({ startX: event.clientX });
                },
            },
        ]);

        return function cleanupAll() {
            cleanupStart();
            cleanupActive?.();
        };
    }, []);
    return { scrollableRef }
}