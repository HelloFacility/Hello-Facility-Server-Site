const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
const jwt = require('jsonwebtoken');
const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.febcvhx.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorozed access' })
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded
    next()
  });
}

async function run() {
  try {
    await client.connect();
    const userCollection = client.db('HelloFacility').collection('User')
    const newAddressCollection = client.db('HelloFacility').collection('Address')
    const newOrderCollection = client.db('HelloFacility').collection('Order')


    // GET ALL USER
    app.get('/user', async (req, res) => {
      const users = await userCollection.find().toArray()
      res.send(users)
    })


    // MAKE AN ADMIN
    app.put('/user/admin/:email', async (req, res) => {
      const email = req.params.email
      const filter = { email: email }
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // Put CREATE USER EMAIL
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options)
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15d' })
      console.log(token, process.env.ACCESS_TOKEN_SECRET);
      res.send({ result, token })
    })


    // ADMIN CHECK FOR REQUIRE ADMIN
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })

    // CUSTOMER CHECK FOR REQUIRE CUSTOMER
    app.get('/customer/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isCustomer = user.role !== 'admin';
      res.send({ customer: isCustomer })
    })

    // Delete user
    app.delete('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.deleteOne({ email: email })
      // const users = await userCollection.find().toArray()
      res.send(user)
    })


    // Post Add New Address
    app.post('/newAddress', async (req, res) => {
      const newAddress = req.body
      console.log('add', newAddress)
      const Address = await newAddressCollection.insertOne(newAddress)
      res.send(Address)
    })

    // Get Add New Address
    app.get("/newAddress", async (req, res) => {
      const query = {};
      const result = await newAddressCollection.find(query).toArray();
      res.send(result);
    });

    // Put Edit Address

    app.put("/newAddress/:id", async (req, res) => {
      const id = req.params.id;
      const EditAddress = req.body;
      const { name, phone, city, area, shortAddress, fullAddress } = EditAddress;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name,
          phone,
          city,
          area,
          shortAddress,
          fullAddress,
        },
      };
      const result = await newAddressCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });


    // Post Add Cleaning Service Order
    app.post('/cleaningServiceOrder', async (req, res) => {
      const newOrder = req.body
      console.log('add', newOrder)
      const Address = await newOrderCollection.insertOne(newOrder)
      res.send(Address)
    })

    // GetCleaning Service Order
    app.get("/cleaningServiceOrder", async (req, res) => {
      const query = {};
      const result = await newOrderCollection.find(query).toArray();
      res.send(result);
    });


    // Update Order Status
    app.put("/updateOrderStatus/:id", async (req, res) => {
      const id = req.params.id;
      const updateStatus = req.body;
      const { orderStatus } = updateStatus;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          orderStatus
        },
      };
      const result = await newOrderCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Get My Order (Customer)

    app.get('/cleaningServiceOrder/:email', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const cursor = newOrderCollection.find(query)
      const order = await cursor.toArray()
      res.send(order)
    })


  }
  finally {

  }
}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello Facility Server')
})

app.listen(port, () => {
  console.log(`Hello Facility listening on port ${port}`)
})