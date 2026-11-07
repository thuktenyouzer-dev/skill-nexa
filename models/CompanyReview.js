const { getMongoDb } = require('../config/mongo');
 
function collection() {
  return getMongoDb().collection('company_reviews');
}
 
async function createReview({ companyId, userId, reviewerName, rating, comment }) {
  const review = {
    companyId: Number(companyId),
    userId: Number(userId),
    reviewerName,
    rating: Number(rating),
    comment,
    createdAt: new Date()
  };
  const result = await collection().insertOne(review);
  return { ...review, _id: result.insertedId };
}
 
async function getByCompany(companyId) {
  return collection().find({ companyId: Number(companyId) }).sort({ createdAt: -1 }).limit(50).toArray();
}
 
async function getRecent(limit = 20) {
  return collection().find({}).sort({ createdAt: -1 }).limit(limit).toArray();
}
 
module.exports = { createReview, getByCompany, getRecent };
