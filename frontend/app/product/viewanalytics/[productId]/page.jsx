// file: frontend/app/product/viewanalytics/[productId]/page.jsx

"use client";

import React, { useState, useEffect } from "react";
import Dashboard from "./Components/Dashboard";
import { useParams } from "next/navigation";
import UserViewHistory from "../../../../Components/View/UserViewHistory";
import viewService from "../../../../services/viewService";

function Page() {
    const { productId } = useParams();
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch product-specific view history only when needed
    useEffect(() => {
        if (showHistory && !historyData) {
            setLoading(true);
            viewService.getUserViewHistory({ productId, page: 1, limit: 12 })
                .then(result => {
                    setHistoryData(result);
                })
                .catch(err => {
                    console.error("Failed to fetch product view history:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [productId, showHistory, historyData]);

    return (
        <>
            <Dashboard productId={productId} />

            {/* Toggle button for history */}
            <div className="p-4 sm:p-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => setShowHistory(prev => !prev)}
                        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                        {showHistory ? "Hide View History" : "Show View History"}
                    </button>

                    {/* Only render UserViewHistory when needed */}
                    {showHistory && (
                        <UserViewHistory
                            productId={productId}
                            initialData={historyData}
                            disableFetch={!historyData && loading}
                            showRecommendations={false}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default Page;
