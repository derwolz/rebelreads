console.log('Testing getBooksByAuthor with images...');
const { BookStorage } = require('./server/storage/books');
const bookStorage = new BookStorage();

async function test() {
  const books = await bookStorage.getBooksByAuthor(2);
  console.log('First book has images?', books[0] && books[0].images ? books[0].images.length : 'no images');
  console.log('Sample:', books[0] ? JSON.stringify(books[0].images.slice(0, 1), null, 2) : 'No books found');
}

test().catch(console.error);