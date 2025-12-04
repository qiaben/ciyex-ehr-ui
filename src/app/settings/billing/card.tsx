"use client";
import React, { useState } from "react";

interface CardsPageProps { }

const CardsPage: React.FC<CardsPageProps> = () => {
    const [cards, setCards] = useState<any[]>([]);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Payment Methods</h2>

            {cards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No payment methods saved yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {cards.map((card, idx) => (
                        <div key={idx} className="p-4 border rounded bg-white">
                            {/* Card details will go here */}
                            <p>Card ending in {card.last4}</p>
                        </div>
                    ))}
                </div>
            )}

            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Payment Method
            </button>
        </div>
    );
};

export default CardsPage;
