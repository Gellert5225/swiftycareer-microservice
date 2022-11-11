const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient;

MongoClient.Promise = global.Promise;

const db = {};

db.connect = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(
            process.env.MONGODB_URI, 
            {useNewUrlParser: true, useUnifiedTopology: true}
        )
        .then((client) => {
            db.database = client.db('swiftycareer_dev');
            resolve(client.db('swiftycareer_dev'));
        })
        .catch(error => {
            reject(error);
        });
    });
}

db.mongodb = mongodb;
db.mongoClient= MongoClient;
db.ROLES = ['user', 'admin', 'mod'];

module.exports = db;