const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017"; // Change if using MongoDB Atlas
const client = new MongoClient(uri);

async function runQueries() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("plp_bookstore");
    const books = db.collection("books");

    // -------------------------------
    // 1️ Basic Queries (CRUD)
    // -------------------------------

    const fictionBooks = await books.find({ genre: "Fiction" }).toArray();
    console.log(" Fiction Books:", fictionBooks);

    const recentBooks = await books.find({ published_year: { $gt: 2000 } }).toArray();
    console.log("Books Published After 2000:", recentBooks);

    const authorBooks = await books.find({ author: "Harper Lee" }).toArray();
    console.log(" Books by Harper Lee:", authorBooks);

    const updated = await books.updateOne(
      { title: "The Great Gatsby" },
      { $set: { price: 12.99 } }
    );
    console.log("Updated The Great Gatsby Price:", updated.modifiedCount);

    const deleted = await books.deleteOne({ title: "The Great Gatsby" });
    console.log(" Deleted The Great Gatsby:", deleted.deletedCount);

    // -------------------------------
    // 2️ Advanced Queries
    // -------------------------------

    const inStockRecent = await books.find({
      in_stock: true,
      published_year: { $gt: 2010 }
    }).toArray();
    console.log("In-Stock & Recent Books:", inStockRecent);

    const projected = await books.find({}, {
      projection: { title: 1, author: 1, price: 1, _id: 0 }
    }).toArray();
    console.log(" Projection (Title, Author, Price):", projected);

    const sortedAsc = await books.find().sort({ price: 1 }).toArray();
    console.log(" Books Sorted by Price (Ascending):", sortedAsc);

    const sortedDesc = await books.find().sort({ price: -1 }).toArray();
    console.log("Books Sorted by Price (Descending):", sortedDesc);

    const page1 = await books.find().skip(0).limit(5).toArray();
    const page2 = await books.find().skip(5).limit(5).toArray();
    console.log(" Page 1:", page1);
    console.log(" Page 2:", page2);

    // -------------------------------
    // 3️ Aggregation Pipelines
    // -------------------------------

    const avgPriceByGenre = await books.aggregate([
      { $group: { _id: "$genre", avgPrice: { $avg: "$price" } } }
    ]).toArray();
    console.log("Average Price by Genre:", avgPriceByGenre);

    const topAuthor = await books.aggregate([
      { $group: { _id: "$author", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]).toArray();
    console.log(" Author with Most Books:", topAuthor);

    const byDecade = await books.aggregate([
      {
        $group: {
          _id: { $floor: { $divide: ["$published_year", 10] } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          decade: {
            $concat: [
              { $toString: { $multiply: ["$_id", 10] } },
              "s"
            ]
          },
          count: 1,
          _id: 0
        }
      }
    ]).toArray();
    console.log(" Books by Decade:", byDecade);

    // -------------------------------
    // 4️Indexing
    // -------------------------------

    await books.createIndex({ title: 1 });
    console.log(" Index created on 'title'");

    await books.createIndex({ author: 1, published_year: -1 });
    console.log("Compound index on 'author' and 'published_year'");

    const explainResult = await books.find({ title: "The Hobbit" }).explain("executionStats");
    console.log("Performance Analysis with explain():", JSON.stringify(explainResult.executionStats, null, 2));

  } catch (err) {
    console.error(" Error:", err);
  } finally {
    await client.close();
    console.log("🔒 Connection closed");
  }
}

runQueries();


