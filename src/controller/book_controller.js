const fetch = require("node-fetch");
const { Book, Genre, Author } = require("../db.js");
const  { authors, getAuthorIdByName } = require("../controller/author_controller");
const  { getGenreIdByName } = require("../controller/genre_controller");

function normalizeApiBook(book) {
    return {
        title: book.subtitle ? `${book.title}, ${book.subtitle}` : book.title,
        // falta ajustar la fecha a solo el año !
        publishedDate: book.publishedDate ? book.publishedDate : "not specified",
        publisher: book.publisher ? book.publisher : "not specified",
        description: book.description ? book.description : "not specified",
        pages: book.pageCount ? book.pageCount : null,
        averageRating: book.averageRating ? book.averageRating : null,
        cover: book.imageLinks ? book.imageLinks.thumbnail : "img_not_found",
        identifier: 
        book.industryIdentifiers[0].type === "OTHER" ? 
        book.industryIdentifiers[0].identifier : 
        `ISBN:${book.industryIdentifiers[0].identifier}`,
        authorsNames: book.authors, // to find de authors ids and set them
        genresNames: book.categories // to find de genres ids and set them
    }
}

async function createDbBooks() {
    let books = [];

    let booksPromises = authors.map(async author => {

        let bookPromise = await fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${author}"keyes&maxResults=2`);
        let jsonBooks = await bookPromise.json(); 
        return jsonBooks.items;    
    });

    let apiBooksXAuthor = await Promise.all(booksPromises);

    apiBooksXAuthor.map(arrayBooks => arrayBooks.map(book => books.push(normalizeApiBook(book.volumeInfo))));

    let newBooks = await Book.bulkCreate(books, { ignoreDuplicates: true });

    let setPromises = books.map(async book => { 
        let authorsIds = await Promise.all(book.authorsNames.map(author => getAuthorIdByName(author)));
        let genresIds = await Promise.all(book.genresNames.map(genre => getGenreIdByName(genre)));

        let dbBook = await Book.findOne({ where: { title: book.title}}); 

        await dbBook.setAuthors(authorsIds);
        await dbBook.setGenres(genresIds); 
    });

    await Promise.all(setPromises);

    newBooks = await getDbBooks(); 

    return newBooks;
}

async function getDbBooks() {
    let dbBooks = await Book.findAll({
        include: [
            {
                model: Author,
                attributes: ["id", "name"],
                through: {
                  raw: true,
                  attributes: [],
                },
            },
            {
                model: Genre,
                attributes: ["id", "name"],
                through: {
                  raw: true,
                  attributes: [],
                },
            }
        ]
    });

    return dbBooks;
}


module.exports = {
    createDbBooks,
    getDbBooks,
}