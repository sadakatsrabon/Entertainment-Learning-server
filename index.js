const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access 1" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, exits) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized Access 2" });
    }
    req.exits = exits;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nwrzj29.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const paymentCollection = client.db("educationEntertainment").collection("payments");

    const usersCollection = client.db("educationEntertainment").collection("users");
    const teachersCollection = client
      .db("educationEntertainment")
      .collection("teachers");
    const classAll = client.db("educationEntertainment").collection("classes");
    const purchessClassCollection = client
      .db("educationEntertainment")
      .collection("purchessClass");

    // app.post("/jwt", (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "1h",
    //   });
    //   res.send({ token });
    // });

    // Admin Verify
    const authinticateAdmin = async (req, res, next) => {
      const email = req.exits.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access 4" });
      }
      next();
    };

    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const userCreated = await usersCollection.findOne(query);
      if (userCreated) {
        return res.send({ message: "User Already Exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.exits.email !== email) {
        res.send({ admin: false });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const newDocument = {
        $set: {
          role: "admin",
        },
      };

      const result = await usersCollection.updateOne(filter, newDocument);
      res.send(result);
    });

    app.patch("/users/teachers/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const newDocument = {
        $set: {
          role: "teachers",
        },
      };

      const result = await usersCollection.updateOne(filter, newDocument);
      res.send(result);
    });

    // app.delete("/allusers/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await usersCollection.deleteOne(query);
    //   res.send(result);
    // });

    app.get("/users", verifyJWT, authinticateAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/classes", async (req, res) => {
      const result = await classAll.find().toArray();
      res.send(result);
    });

    app.get("/teachers", async (req, res) => {
      const result = await teachersCollection.find().toArray();
      res.send(result);
    });

    app.post("/purchessClass", async (req, res) => {
      const item = req.body;

      const query = { userEmail: item.userEmail, purchessId: item.purchessId };

      const esistingPurchess = await purchessClassCollection.findOne(query);

      if (esistingPurchess) {
        return res.send({ message: "You have already Purchess" });
      }

      console.log(esistingPurchess, "existingPurchess");
      const result = await purchessClassCollection.insertOne(item);
      res.send(result);
    });

    app.get("/acquired", verifyJWT, async (req, res) => {
      const queryEmail = req.query.email;
      if (!queryEmail) {
        res.send([]);
      }

      const exitsEmail = req.exits.email;
      console.log(exitsEmail, "exits");

      if (queryEmail !== exitsEmail) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access here" });
      }

      const query = { userEmail: queryEmail };
      const result = await purchessClassCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/purchess", verifyJWT, async (req, res) => {
      const queryEmail = req.query.email;
      if (!queryEmail) {
        res.send([]);
      }

      const exitsEmail = req.exits.email;
      console.log(exitsEmail, "exits");

      if (queryEmail !== exitsEmail) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access 3" });
      }

      const query = { email: queryEmail };
      const result = await paymentCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    // app.get("/profile", verifyJWT, async (req, res) => {
    //   const queryEmail = req.query.email;
    //   if (!queryEmail) {
    //     res.send([]);
    //   }

    //   const exitsEmail = req.exits.email;
    //   console.log(exitsEmail, queryEmail, "exits");

    //   if (queryEmail !== exitsEmail) {
    //     return res
    //       .status(403)
    //       .send({ error: true, message: "Forbidden Access 3" });
    //   }

    //   const query = { email: queryEmail };
    //   const result = await usersCollection.find(query).toArray();
    //   console.log(result);
    //   res.send(result);
    // });

    // app.delete("/acquired/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await purchessClassCollection.deleteOne(query);
    //   res.send(result);
    // });

    // // Payment
    // app.post("/create-payment-intent", verifyJWT, async (req, res) => {
    //   const { price } = req.body;
    //   console.log(price, "price");
    //   const amount = Math.round(price * 100);
    //   console.log(amount, "amount");
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount,
    //     currency: "usd",
    //     automatic_payment_methods: {
    //       enabled: true,
    //     },
    //   });

    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });

    // app.post("/payments", verifyJWT, async (req, res) => {
    //   const payment = req.body;
    //   const insertResult = await paymentCollection.insertOne(payment);

    //   const query = {
    //     _id: { $in: payment.cartItems.map((id) => new ObjectId(id)) },
    //   };
    //   const deleteResult = await purchessClassCollection.deleteMany(query);
    //   res.send({ insertResult, deleteResult });
    // });

    // // Send a ping to confirm a successful connection
    console.log('hei ');
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (res, req) => {
  req.send("educationEntertainment Classroom is Running");
});
app.listen(port, () => {
  console.log(`Hei Welcome to educationEntertainment , please sit on ${port} `);
});
