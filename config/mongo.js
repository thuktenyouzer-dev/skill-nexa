const { MongoClient } = require('mongodb');
 
let client;
let database;
 
async function connectMongo() {
  if (database) return database;
  const uri = process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGO_URI
    : process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI is required in production.');
    }
    console.warn('MongoDB is not configured. Company reviews will be unavailable until MONGO_URI is set.');
    return null;
  }
  client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGO_DB_NAME || (process.env.NODE_ENV === 'test' ? 'skill_nexa_test' : 'skill_nexa');
  database = client.db(dbName);
  await database.collection('company_reviews').createIndex({ companyId: 1, createdAt: -1 });
  return database;
}
 
function getMongoDb() {
  if (!database) throw new Error('MongoDB is not connected. Start the server after configuring MONGO_URI.');
  return database;
}
 
async function closeMongo() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
}
 
module.exports = { connectMongo, getMongoDb, closeMongo };