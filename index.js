const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(express.json());
app.use(cors());
//verify jwt / authentication
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECURE, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

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
    const usersCollection = client.db("proper_parts").collection("users");

    //verify admin
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };
    /* --------------Tools Collection Api Start----------------------- */
    //tools get api
    app.get("/tools", async (req, res) => {
      const tools = await toolsCollection.find({}).toArray();
      res.send(tools);
    });
    // added tools api
    app.post("/tools", verifyJWT, verifyAdmin, async (req, res) => {
      const product = req.body;
      const result = await toolsCollection.insertOne(product);
      res.send(result);
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
    // get my purchase collection
    app.delete("/myPurchase/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await purchaseCollection.deleteOne(filter);
      res.send(result);
    });

    // delete single order api
    app.get("/myPurchase/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const myPurchase = await purchaseCollection
        .find({ email: email })
        .toArray();
      res.send(myPurchase);
    });

    /* --------------Purchases Collection Api End----------------------- */

    /* --------------Reviews Collection Api Start----------------------- */
    //get reviews api
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find().toArray();
      res.send(reviews);
    });

    //post review api
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    /* --------------Reviews Collection Api End----------------------- */
    /* --------------User Collection Api Start----------------------- */

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECURE,
        {
          expiresIn: "10h",
        }
      );
      res.send({ result, token });
    });
    //get all users
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });
    //make admin user api
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // check the user is admin or not api
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    /* --------------User Collection Api End----------------------- */
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
