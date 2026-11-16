const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_URI = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

async function inspect() {
  await mongoose.connect(TARGET_URI);
  const db = mongoose.connection.db;
  const col = db.collection('products');

  const cursor = col.find({}, { projection: { id: 1, name: 1, author: 1, publisher: 1, publicationYear: 1, pages: 1, isbn: 1, specs: 1, bookFormat: 1 } });
  
  let countShort = 0;
  let total = 0;
  while (await cursor.hasNext()) {
    const p = await cursor.next();
    total++;
    const keys = p.specs ? Object.keys(p.specs) : [];
    if (keys.length <= 2) {
      countShort++;
      if (countShort <= 5) {
        console.log('Short specs product:', {
          id: p.id,
          name: p.name,
          author: p.author,
          publisher: p.publisher,
          publicationYear: p.publicationYear,
          pages: p.pages,
          isbn: p.isbn,
          bookFormat: p.bookFormat,
          specs: p.specs
        });
      }
    }
  }

  console.log(`Total products scanned: ${total}, with short specs (<= 2 keys): ${countShort}`);
  await mongoose.disconnect();
}

inspect();
