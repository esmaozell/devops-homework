const express = require("express");
const redis = require("redis");
const dbConnection = require("./helper/mysql");
const app = express();
const client = redis.createClient();
const bodyParser = require('body-parser');
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();
client.on('connect', function() {
  console.log('Connected!');
});
app.get('/blogpost.html', (req, res) => {
  res.sendFile(__dirname + '/blogpost.html');
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.post('/blogpost', (req, res) => {
  const { title, body, tags, authorName } = req.body;
  const createdAt = new Date();
  const sql = 'INSERT INTO blog_posts (title, body, tags, created_at, author_name) VALUES (?, ?, ?, ?, ?)';
  dbConnection.query(sql, [title, body, tags, createdAt, authorName], (err, result) => {
      if (err) {
          console.error('Error inserting blog post: ' + err.stack);
          res.status(500).json({ error: 'Error inserting blog post' });
          return;
      }
      console.log('Blog post added with ID: ' + result.insertId);
      res.status(201).json({ message: 'Blog post added successfully', postId: result.insertId });
  });
});
app.get("/blog/:id", (req, res) => {
  const postId = req.params.id;
  dbConnection.query("SELECT * FROM blog_posts WHERE id = ?", [postId], (err, results) => {
    if (err) {
      console.log("Db ye bağlanamadı", err);
      return res.status(500).send("Veritabanına bağlanırken bir hata oluştu.");
    }
    if (results.length === 0) {
      return res.status(404).send("Belirtilen ID ile eşleşen blog yazısı bulunamadı.");
    }
    res.send(results);
    console.log("Olduu");
  });
});
function checkBlog(req, res, next) {
  const key = req.params.id;
  client.get(key, (err, data) => {
    if (err) throw err;
    if (data) {
      console.log('Cache hit for post with ID:', key);
      res.json({ message: 'Cached data returned', data: JSON.parse(data) });
    } else {
      console.log('Cache miss for post with ID:', key);
      fetch('http://localhost:2001/blog/' + req.params.id)
        .then((response) => response.json())
        .then((data) => {
          client.setex(key, 3600, JSON.stringify(data));
          res.json({ message: 'Fresh data fetched', data });
        })
        .catch((error) => {
          res.status(500).json({ error: 'An error occurred while fetching data.' });
        });
    }
  });
}
app.get("/blog/:id", checkBlog);
  app.listen(2001, () => {
    console.log("Server is running on port 2001");
  });
;