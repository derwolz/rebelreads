import { BookStorage } from './server/storage/books';

console.log('Testing getBooksByAuthor with images...');
const bookStorage = new BookStorage();

async function test() {
  try {
    const books = await bookStorage.getBooksByAuthor(2);
    console.log('Found books:', books.length);
    console.log('First book has images?', books[0] && books[0].images ? books[0].images.length : 'no images');
    console.log('Sample:', books[0] ? JSON.stringify(books[0].images.slice(0, 1), null, 2) : 'No books found');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

test();