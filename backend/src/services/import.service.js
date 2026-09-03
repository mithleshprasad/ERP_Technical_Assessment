const { Worker } = require('worker_threads');
const path = require('path');
const config = require('../config/config')[process.env.NODE_ENV || 'development'];
const cache = require('./cache.service');

function runProductImport(fileBuffer) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../workers/importWorker.js'), {
      workerData: { fileBuffer, dbConfig: config },
    });

    worker.on('message', (msg) => {
      if (msg.type === 'result') resolve(msg.payload);
      else reject(new Error(msg.message));
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Import worker exited with code ${code}`));
    });
  }).then(async (result) => {
    if (result.importedCount > 0) {
      await cache.invalidateProductLists();
    }
    return result;
  });
}

module.exports = { runProductImport };
