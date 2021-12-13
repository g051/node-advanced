const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function () {
  this.useCache = true;

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  // See if we have a value for 'key' in redis
  const cacheVal = await client.get(key);

  // If yes, return that
  if (cacheVal) {
    const doc = JSON.parse(cacheVal);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);
  client.set(key, JSON.stringify(result), 'EX', 10); // Redis caching will auto expire in 10 seconds

  console.log(key, result);
  return result;
};
