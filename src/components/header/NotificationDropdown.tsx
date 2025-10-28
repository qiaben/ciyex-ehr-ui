"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const [notifications, setNotifications] = useState<
        { id: number; message: string; time: string }[]
    >([]);

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    const handleClick = () => {
        toggleDropdown();
        setNotifying(false);
    };

    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent<{ message: string }>;
            // Make sure IDs are unique
            const id = Date.now() + Math.random();
            const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            setNotifications((prev) => [
                { id, message: custom.detail.message, time },
                ...prev,
            ]);
            setNotifying(true);
        };

        window.addEventListener("app-notification", handler);
        return () => window.removeEventListener("app-notification", handler);
    }, []);

    return (
        <div className="relative">
            <button
                className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100"
                onClick={handleClick}
            >
        <span
            className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
                !notifying ? "hidden" : "flex"
            }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
                <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                        fill="currentColor"
                    />
                </svg>
            </button>

            <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute -right-[240px] mt-[17px] flex h-[400px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-lg"
            >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <h5 className="text-lg font-semibold text-gray-800">Notifications</h5>
                    <button
                        onClick={toggleDropdown}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <li className="text-sm text-gray-500 p-3">No new notifications</li>
                    ) : (
                        notifications.map((n) => (
                            <li key={n.id}>
                                <DropdownItem
                                    onItemClick={closeDropdown}
                                    className="flex flex-col gap-1 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100"
                                ><div className="flex items-start gap-3">
                                    {/* 🔔 Icon */}
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full 
      ${n.message.startsWith("Critical") ? "bg-red-100 text-red-600" :
                                            n.message.startsWith("Out of Stock") ? "bg-orange-100 text-orange-600" :
                                                "bg-yellow-100 text-yellow-600"}`}
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.602c.75 1.336-.213 2.999-1.742 2.999H3.481c-1.529 0-2.492-1.663-1.742-2.999L8.257 3.1zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-1-2a.75.75 0 01-.75-.75V8a.75.75 0 011.5 0v3.25A.75.75 0 0110 12z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>

                                    {/* Message content */}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-800">{n.message}</span>
                                        <span className="text-xs text-gray-500">{n.time}</span>
                                    </div>
                                </div>

                                </DropdownItem>
                            </li>
                        ))
                    )}
                </ul>
            </Dropdown>
        </div>
    );
}
