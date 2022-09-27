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


    // GET ALL USER
    app.get('/user', async (req, res) => {
      const users = await userCollection.find().toArray()
      res.send(users)
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
    // app.put("/newAddress/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const { EditAddress } = req.body;
    //   const filter = { _id: ObjectId(id) };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       EditAddress,
    //     },
    //   };
    //   const result = await newAddressCollection.updateOne(
    //     filter,
    //     updateDoc,
    //     options
    //   );
    //   res.send(result);
    // });

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