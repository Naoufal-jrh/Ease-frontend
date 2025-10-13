const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getHeaders() {
    return {
        'Content-Type': 'application/json',
    };
}

async function apiFetch(path, { method = 'GET', body = null, retries = 2 } = {}) {
    const url = `${BASE_URL}${path}`;
    try {
        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: body !== null ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            let message = `Error: ${res.status}`;
            try {
                const data = await res.json();
                message = data?.error || message;
            } catch { }
            throw new Error(message);
        }
        return await res.json();
    } catch (err) {
        if (retries > 0) {
            // simple backoff (could add more logic)
            await new Promise(r => setTimeout(r, 250));
            return apiFetch(path, { method, body, retries: retries - 1 });
        }
        // Here you can do centralized logging if desired
        // e.g. console.error("API Error", err);
        throw err;
    }
}

export async function getBoards() {
    return await apiFetch("/board")
}

export async function addBoard(board) {
    return await apiFetch("/board", {
        method: 'POST',
        body: board
    });
}

export async function getBoardById(boardId) {
    return await apiFetch(`/board/${boardId}`);
}

export async function updateCards(columnId, cards) {
    return await apiFetch(`/card/toColumn/${columnId}`, {
        method: 'PUT',
        body: cards
    });
}

export async function updateColumns(boardId, columns) {
    return await apiFetch(`/column/toBoard/${boardId}`, {
        method: 'PUT',
        body: columns
    });
}

export async function addColumn(boardId, column) {
    console.log("adding new column : ", column)
    console.log("to board", boardId)
    return await apiFetch(`/column?boardId=${boardId}`, {
        method: "POST",
        body: {
            ...column,
            boardId: boardId
        }
    });
}

export async function addCard(columnId, card) {
    return await apiFetch(`/card?columnId=${columnId}`, {
        method: "POST",
        body: card
    });
}