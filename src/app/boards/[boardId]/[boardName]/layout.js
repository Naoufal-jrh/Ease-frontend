import "../../../globals.css";


export default function BoardDetailsLayout({ children, params }) {
    const { boardName } = params;
    return (

        <div>
            <header className="bg-orange-700 px-20 py-4">
                <h1 className="capitalize text-white font-bold text-lg">
                    {boardName.replace("-", " ")}
                </h1>
            </header>
            <main>{children}</main>
        </div>

    );

}