"use client";
import React, { useState } from "react";

interface CardsPageProps { }

const CardsPage: React.FC\u003cCardsPageProps\u003e = () =\u003e {
    const [cards, setCards] = useState\u003cany[]\u003e([]);

return (
\u003cdiv className = "space-y-4"\u003e
\u003ch2 className = "text-lg font-semibold"\u003ePayment Methods\u003c / h2\u003e

{
    cards.length === 0 ? (
    \u003cdiv className = "text-center py-8 text-gray-500"\u003e
                    No payment methods saved yet.
    \u003c / div\u003e
            ) : (
    \u003cdiv className = "space-y-2"\u003e
    {
        cards.map((card, idx) =\u003e(
            \u003cdiv key = { idx } className = "p-4 border rounded bg-white"\u003e
                            {/* Card details will go here */ }
            \u003cp\u003eCard ending in { card.last4 }\u003c / p\u003e
            \u003c / div\u003e
        ))
    }
    \u003c / div\u003e
            )
}

\u003cbutton className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"\u003e
                Add Payment Method
\u003c / button\u003e
\u003c / div\u003e
    );
};

export default CardsPage;
