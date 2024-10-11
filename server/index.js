const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
//middleware

app.use(express.json());

app.get('/myapp', (req, res) => {
    return res.json('Hello World');
})


app.listen(3001, () => {
  console.log('Server is running on port 3001');
})