"use client"

import { useEffect, useRef, useState } from "react";
import Column from "./Column";
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

export default function Board({ data, setData, fetchBoard }) {
    const scrollableRef = useRef(null);
    // const [data, setData] = useState(initial);

    async function updateCardsList(columnId, cards) {
        console.log("changing the cards order of the column with id ", columnId)
        console.log("new cards order : " + cards)
        const res = await fetch("http://localhost:8080/column/" + columnId,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cards: cards,
                }),
            }
        );
        const newColumn = await res.json()
        // console.log(newColumn);
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
                    const homeColumnIndex = data.columns.findIndex(
                        (column) => column.id === dragging.columnId,
                    );
                    const home = data.columns[homeColumnIndex];

                    if (!home) {
                        return;
                    }
                    const cardIndexInHome = home.cards.findIndex((card) => card.id === dragging.card.id);

                    // dropping on a card
                    if (isCardDropTargetData(dropTargetData)) {
                        const destinationColumnIndex = data.columns.findIndex(
                            (column) => column.id === dropTargetData.columnId,
                        );
                        const destination = data.columns[destinationColumnIndex];
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
                            const columns = Array.from(data.columns);
                            columns[homeColumnIndex] = updated;
                            // here call the patch api with the column id and the column new cards list
                            // new list : columns
                            // column id : dropTargetData.columnId
                            // console.log("reordering in home column")
                            // console.log("column id", home.id)
                            // console.log("reordered cards", reordered)
                            updateCardsList(home.id, reordered.map(({ id }) => ({ id })));
                            setData({ ...data, columns });
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

                        const columns = Array.from(data.columns);
                        columns[homeColumnIndex] = {
                            ...home,
                            cards: homeCards,
                        };
                        columns[destinationColumnIndex] = {
                            ...destination,
                            cards: destinationCards,
                        };
                        // console.log("moving a card from one column to another");
                        // console.log("source column id:", home.id);
                        // console.log("destination column id:", destination.id);
                        // console.log("moved card:", dragging.card);

                        // console.log("new source column cards:", homeCards);
                        // console.log("new destination column cards:", destinationCards);
                        updateCardsList(home.id, homeCards)
                            .then(() => updateCardsList(destination.id, destinationCards));
                        setData({ ...data, columns });
                        return;
                    }

                    // dropping onto a column, but not onto a card
                    if (isColumnData(dropTargetData)) {
                        const destinationColumnIndex = data.columns.findIndex(
                            (column) => column.id === dropTargetData.column.id,
                        );
                        const destination = data.columns[destinationColumnIndex];

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
                            const columns = Array.from(data.columns);
                            columns[homeColumnIndex] = updated;
                            setData({ ...data, columns });
                            return;
                        }

                        console.log('moving card to another column');

                        // remove card from home list

                        const homeCards = Array.from(home.cards);
                        homeCards.splice(cardIndexInHome, 1);

                        // insert into destination list
                        const destinationCards = Array.from(destination.cards);
                        destinationCards.splice(destination.cards.length, 0, dragging.card);

                        const columns = Array.from(data.columns);
                        columns[homeColumnIndex] = {
                            ...home,
                            cards: homeCards,
                        };
                        columns[destinationColumnIndex] = {
                            ...destination,
                            cards: destinationCards,
                        };

                        updateCardsList(home.id, homeCards)
                            .then(() => updateCardsList(destination.id, destinationCards));
                        setData({ ...data, columns });
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

                    const homeIndex = data.columns.findIndex((column) => column.id === dragging.column.id);
                    const destinationIndex = data.columns.findIndex(
                        (column) => column.id === dropTargetData.column.id,
                    );

                    if (homeIndex === -1 || destinationIndex === -1) {
                        return;
                    }

                    if (homeIndex === destinationIndex) {
                        return;
                    }

                    const reordered = reorder({
                        list: data.columns,
                        startIndex: homeIndex,
                        finishIndex: destinationIndex,
                    });
                    setData({ ...data, columns: reordered });
                },
            }),
            // handling horizontal scrolling
            autoScrollForElements({
                canScroll({ source }) {
                    // if (!settings.isOverElementAutoScrollEnabled) {
                    //     return false;
                    // }

                    return isDraggingACard({ source }) || isDraggingAColumn({ source });
                },
                // getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
                element,
            }),
            // handle columns overflow for scroll
            unsafeOverflowAutoScrollForElements({
                element,
                // getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
                canScroll({ source }) {
                    // if (!settings.isOverElementAutoScrollEnabled) {
                    //     return false;
                    // }

                    // if (!settings.isOverflowScrollingEnabled) {
                    //     return false;
                    // }

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
    }, [data]);

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

    return (
        <div className={`flex h-full flex-col`}>
            <div
                className={`flex h-full flex-row gap-3 overflow-x-auto p-3 [scrollbar-color:theme(colors.sky.600)_theme(colors.sky.800)] [scrollbar-width:thin]`}
                ref={scrollableRef}
            >
                {data.columns.map((column) => (
                    <Column key={column.id} column={column} fetchBoard={fetchBoard} />
                ))}
            </div>
        </div>
    );
}