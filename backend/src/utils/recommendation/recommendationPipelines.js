export const buildAggregationPipeline = (config = {}) => {
  const {
    match = { status: "Published" }, // Renamed from $match to match for clarity
    lookups = ["views", "upvotes", "bookmarks", "categories", "users"],
    extraFields = {},
    sort = { createdAt: -1 },
    limit = 50,
    skip = 0,
  } = config;

  // Use match explicitly as the value for the $match stage
  const pipeline = [{ $match: match }];

  const lookupConfigs = {
    views: {
      from: "views",
      localField: "_id",
      foreignField: "product",
      as: "viewsData",
    },
    upvotes: {
      from: "upvotes",
      localField: "_id",
      foreignField: "product",
      as: "upvoteData",
    },
    bookmarks: {
      from: "bookmarks",
      localField: "_id",
      foreignField: "product",
      as: "bookmarkData",
    },
    categories: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "categoryData",
    },
    users: {
      from: "users",
      localField: "maker",
      foreignField: "_id",
      as: "makerData",
    },
  };

  lookups.forEach((type) => {
    if (lookupConfigs[type]) pipeline.push({ $lookup: lookupConfigs[type] });
  });

  // First, add the count fields from the lookup data
  pipeline.push({
    $addFields: {
      views: {
        count: { $size: "$viewsData" },
        unique: { $size: { $setUnion: ["$viewsData.user"] } },
      },
      upvoteCount: { $size: "$upvoteData" },
      bookmarkCount: { $size: "$bookmarkData" },
      commentCount: { $ifNull: ["$commentCount", 0] },
      category: { $arrayElemAt: ["$categoryData", 0] },
      maker: { $arrayElemAt: ["$makerData", 0] },
      ageInDays: {
        $divide: [
          { $subtract: [new Date(), "$createdAt"] },
          1000 * 60 * 60 * 24,
        ],
      },
      ...extraFields,
    },
  });

  // Then, add a stage to ensure we have the latest counts
  // This is crucial for ensuring the counts are accurate after user interactions
  pipeline.push({
    $lookup: {
      from: "upvotes",
      let: { productId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
        { $count: "count" }
      ],
      as: "upvoteCountData"
    }
  });

  pipeline.push({
    $lookup: {
      from: "bookmarks",
      let: { productId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
        { $count: "count" }
      ],
      as: "bookmarkCountData"
    }
  });

  // Update the counts with the latest values
  pipeline.push({
    $addFields: {
      upvoteCount: {
        $cond: [
          { $gt: [{ $size: "$upvoteCountData" }, 0] },
          { $arrayElemAt: ["$upvoteCountData.count", 0] },
          "$upvoteCount"
        ]
      },
      bookmarkCount: {
        $cond: [
          { $gt: [{ $size: "$bookmarkCountData" }, 0] },
          { $arrayElemAt: ["$bookmarkCountData.count", 0] },
          "$bookmarkCount"
        ]
      }
    }
  });

  pipeline.push({ $sort: sort }, { $skip: skip }, { $limit: limit });
  return pipeline;
};