const fetch = require("node-fetch");
const { Book, Genre, Author } = require("../db.js");
const  { authors, getAuthorIdByName } = require("../controller/author_controller");
const  { getGenreIdByName } = require("../controller/genre_controller");


function validateId(id) {
    const regexId = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
    if(!regexId.test(id)){
        throw new Error("Id invalido para la base de datos");
    }
}

function validatePost({ title, publishedDate, publisher, authorsId, genresId, averageRating }) {

    if(!title) throw new Error("debe ingresar un titulo");
    if(!publishedDate) throw new Error("debe ingresar una fecha de publicación");
    if(!publisher) throw new Error("debe ingresar una editorial");
    if(!authorsId) throw new Error("debe ingresar al menos un autor");
    if(!genresId) throw new Error("debe ingresar al menos un género");

    var regexName = /^[a-zA-Z\s]+$/;
    if(!regexName.test(title)){
        throw new Error("Nombre invalido, no puede contener simbolos, ni numeros");
    }

    let regexAverageRatin = /^\d+$/;
    if(averageRating === "") averageRating = null;
    if(averageRating && !regexAverageRatin.test(averageRating)) {
        throw new Error("el averageRating debe ser un numero");
    }
    if(averageRating < 0 || averageRating > 5) {
        throw new Error("el healthScore debe estar entre 0 y 5");
    }

    authorsId.forEach(id => validateId(id));
    genresId.forEach(id => validateId(id));
}

function normalizeApiBook(book, author) {
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
        authors: [ author ],// to find de authors ids and set them
        genresNames: book.categories ? book.categories : [] // to find de genres ids and set them
    }
}

async function createDbBooks() {
    let apiBooks = [];

    let booksPromises = authors.map(async author => {

        let bookPromise = await fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${author}"keyes&maxResults=2`);
        let jsonBooks = await bookPromise.json(); 
        return jsonBooks.items.map(item => {
            return normalizeApiBook(item.volumeInfo, author);
        });    
    });
    let apiBooksXAuthor = await Promise.all(booksPromises);

    apiBooksXAuthor.map(arrayBooks => arrayBooks.map(book => apiBooks.push(book)));

    await Book.bulkCreate(apiBooks);

    let setPromises = apiBooks.map(async apiBook => {
        let dbBook = await Book.findOne({ 
            where: { title: apiBook.title  },
        });

        let idPromises = apiBook.authors.map(async author => {
            id = await getAuthorIdByName(author);
            return id;
        })  
        
        let authorsIds = await Promise.all(idPromises);
        console.log(authorsIds)

        authorsIds && await dbBook.setAuthors( authorsIds );
    })
    
    await Promise.all(setPromises);

    return await getDbBooks(); 
}

async function getDbBooks() {
    let books = await Book.findAll({ 
        include: {
                model: Author,
                attributes: ["id", "name"],
                through: {
                  attributes: [],
                },
            }
            // {
            //     model: Genre,
            //     attributes: ["id", "name"],
            //     through: {
            //       attributes: [],
            //     },
            // }
     });
    return books;
}

async function getBookById(id) {
    let books = await Book.findByPk(id, { include });
    return books;
}

async function getBooksBytitle(title) {
    console.log(title)
    let books = await getDbBooks();
    console.log(books)
    return books.filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
}

async function getTrendingsBooks() {

    let books = await getDbBooks();
    const topTen = [];

    const sortedbyAverageRating = books.sort(function (a,b){
        if(b.averageRating>a.averageRating){
          return 1;
        }
        if(a.averageRating>b.averageRating){
          return -1;
        }
        return 0;
    })

    for(let i = 0; i < 10;i++){
        topTen.push(sortedbyAverageRating[i])
    }

    return topTen;
}


module.exports = {
    createDbBooks,
    getDbBooks,
    getBooksBytitle,
    getBookById,
    getTrendingsBooks,
    validateId,
    validatePost 
}

// async function createDbBooks() {
//     let books = [];

//     let booksPromises = authors.map(async author => {

//         let bookPromise = await fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${author}"keyes&maxResults=1`);
//         let jsonBooks = await bookPromise.json(); 
//         return jsonBooks.items;    
//     });
//     let apiBooksXAuthor = await Promise.all(booksPromises);

//     apiBooksXAuthor.map(arrayBooks => arrayBooks.map(book => books.push(normalizeApiBook(book.volumeInfo))));

//     await Book.bulkCreate(books, { ignoreDuplicates: true });

//     let setPromises = books.map(async book => {

//         let dbBook = await Book.findOne({ where: { title: book.title}}); 

//         let authorsIds = await Promise.all(book.authorsNames.map(author => getAuthorIdByName(author)));
//         let genresIds = await Promise.all(book.genresNames.map(genre => getGenreIdByName(genre)));

//         await dbBook.setAuthors(authorsIds);
//         await dbBook.setGenres(genresIds); 
//     });
//     await Promise.all(setPromises);

//     return await getDbBooks(); 
// }