import { XIcon } from "lucide-react";
import { useState } from "react";

export default function PopUp({ isOpen, setIsOpen, title, buttonText, children }) {

    return (
        <div className="">

            <button
                className="bg-blue-400 text-slate-700 font-medium px-4 py-1 rounded-lg cursor-pointer hover:bg-blue-500"
                onClick={() => setIsOpen(true)}>

                {buttonText || "open"}

            </button>

            {
                isOpen &&
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold">
                                {title || ""}
                            </h2>
                            <button
                                className="p-2 rounded hover:bg-gray-200 cursor-pointer"
                                onClick={() => setIsOpen(false)}
                            >
                                <XIcon />
                            </button>
                        </div>
                        {children}
                    </div>
                </div>
            }

        </div>
    );
}