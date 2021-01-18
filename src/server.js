import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

// GET Requests Testing with memory driven JSON DB
// app.get('/hello', (req, res) => res.send('Hello!'));
// app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}`));


// Database open and close structure
const withDB = async (requestOperations, res) => {
    try {    
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-node-blog');

        await requestOperations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({message: "Error! Unable to connect to Database.", error});
    }};

// MongoDB call to get responses from a named article in the url
app.get('/api/articles/:name', (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(articleInfo)
    }, res);
});

// MongoDB call to get all articles
app.get('/api/articles/', (req, res) => {
    withDB(async (db) => {
        let allArticles = [];
        let query = await db.collection('articles').find({}).toArray();

        query.forEach((article) => {
            article.published ? allArticles.push(article) : null
        })

        res.status(200).json(allArticles)
    }, res);
});

// Post Requests
// app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}` ));


// MongoDB call to get commetns & upvotes from a named article in the url
app.post('/api/articles/:name/upvote', (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        await db.collection('articles').updateOne({ name: articleName }, {'$set': { upvotes: articleInfo.upvotes + 1 }});
    
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    
    //     res.status(200).send(`\n\n"${updatedArticleInfo.name}" now has ${updatedArticleInfo.upvotes} upvotes!\n\n`);
    // }, res);
        res.status(200).json(updatedArticleInfo)
    }, res);
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const { userName, text } = req.body;
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
    
        // await db.collection('articles').updateOne({ name: articleName }, {'$set': { comments: articleInfo.comments.concat({userName, text}) }});

        await db.collection('articles').updateOne({ name: articleName }, { $push: { comments: { $each: [ {userName, text} ], $position: 0 } } });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

    //     res.status(200).send(`\n\n"${updatedArticleInfo.name}" now has ${updatedArticleInfo.comments.length} comments!\n\n`);
    // }, res);
        res.status(200).json(updatedArticleInfo)
    }, res);
});




app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

// Port determinant
app.listen(8000, () => console.log('listening on post 8000'));