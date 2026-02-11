import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ExpertSidebar from "../components/expert/ExpertSidebar";
import ExpertHeader from "../components/expert/ExpertHeader";

export default function ExpertReviews() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  // Reviews will be fetched from a reviews API when implemented
  const reviews = [];

  const averageRating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "—";

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) *
        100
      : 0,
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      <ExpertSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ExpertHeader onMenuClick={() => setSidebarOpen(true)} user={user} />

        <main className="flex-1 overflow-y-auto">
          <motion.div className="px-6 py-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Reviews & Ratings
              </h1>
              <p className="text-sm text-gray-600">
                See what your clients are saying about your services
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {reviews.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <i className="ri-star-line text-5xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-gray-600 max-w-sm mx-auto">
                      When farmers leave reviews after consultations, they will
                      appear here. Complete consultations to start receiving
                      feedback.
                    </p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                          {review.client
                            ? review.client
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-base font-semibold text-gray-900">
                                {review.client}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {review.service}
                              </p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {review.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`${
                                    i < review.rating
                                      ? "ri-star-fill text-yellow-400"
                                      : "ri-star-line text-gray-300"
                                  }`}
                                ></i>
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {review.rating}.0
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rating Summary */}
              <div className="space-y-4">
                {/* Overall Rating */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Overall Rating
                  </h2>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {averageRating}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className="ri-star-line text-gray-300 text-xl"
                        ></i>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {reviews.length === 0
                        ? "No reviews yet"
                        : `Based on ${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {ratingDistribution.map((dist, index) => (
                      <motion.div
                        key={dist.rating}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm text-gray-600 w-8">
                          {dist.rating}{" "}
                          <i className="ri-star-fill text-yellow-400"></i>
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${dist.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {dist.count}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Review Stats
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Total Reviews
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {reviews.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        5-Star Reviews
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {reviews.filter((r) => r.rating === 5).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">
                    <i className="ri-lightbulb-line text-yellow-500 mr-2"></i>
                    Getting Started
                  </h2>
                  <p className="text-sm text-gray-700">
                    Complete consultations to start receiving reviews from
                    farmers. Good reviews help you attract more clients and build
                    your reputation on AgroMedicana.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
