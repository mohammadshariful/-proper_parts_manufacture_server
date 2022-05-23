const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cw6pj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("proper_parts").collection("tools");
    const purchaseCollection = client.db("proper_parts").collection("purchase");
    const reviewsCollection = client.db("proper_parts").collection("reviews");
    /* --------------Tools Collection Api Start----------------------- */
    //tools get api
    app.get("/tools", async (req, res) => {
      const tools = await toolsCollection.find({}).toArray();
      res.send(tools);
    });
    // find single tool
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      res.send(result);
    });
    /* --------------Tools Collection Api End----------------------- */
    /* --------------Purchases Collection Api Start----------------------- */
    // purchase collection api
    app.post("/purchase", async (req, res) => {
      const purchase = req.body;
      const result = await purchaseCollection.insertOne(purchase);
      res.send(result);
    });
    /* --------------Purchases Collection Api End----------------------- */

    /* --------------Reviews Collection Api Start----------------------- */
    //get reviews api
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find({}).toArray();
      res.send(reviews);
    });

    //post review api
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    /* --------------Reviews Collection Api End----------------------- */
  } finally {
    //   client.close();
  }
}

run().catch(console.dir);

//root api
app.get("/", (req, res) => {
  res.send("proper parts server running");
});
//port listent
app.listen(port, () => {
  console.log(`proper parts server running ${port}`);
});
