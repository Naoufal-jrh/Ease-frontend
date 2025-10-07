import Form from 'next/form'

export default function AddTaskForm({ list, fetchTasks, setShowAddForm }) {


    const addTask = async (formData) => {
        const taskTitle = formData.get("title");
        if (taskTitle === "") {
            setShowAddForm(false);
            return;
        }
        await fetch("http://localhost:8080/task", {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(
                { title: taskTitle, list: list, done: false }
            )
        })

        // refetch tasks
        fetchTasks();
    }
    return (
        <Form action={addTask}>
            <input
                type="text"
                name="title"
                placeholder="Enter a title"
                className="w-full px-3 pt-2 pb-5 rounded-lg mt-4 bg-gray-600"
            />
            <div className="flex flex-row gap-2 items-center mt-3">
                <button
                    type="submit"
                    className="py-2 px-3 bg-blue-400 hover:bg-blue-500 rounded-xl font-bold cursor-pointer"
                >
                    Add Card
                </button>
                <button
                    className="p-2 rounded-xl hover:bg-gray-800 cursor-pointer"
                    onClick={() => setShowAddForm(false)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </Form>

    );
}