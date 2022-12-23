const express = require("express");
const {
  createDbBooks,
  getDbBooks,
  getBooksBytitle,
  getBookById,
  getTrendingsBooks,
  getNewBooks,
  validateId,
  validatePost,
} = require("../controller/book_controller");
const { getUserById } = require("../controller/user_controller");
const { Book, Author, Genre, Review, User } = require("../db.js");

const router = express();
router.use(express.json());

// author id = 5a491c43-463a-4435-9fa6-bd85112525b3
// genre id = f91199a2-5650-438b-b4ec-ae5872aef461

// {
//     "title": "Nuevo Libro",
//     "publishedDate": "2022",
//     "publisher": "Ejemplo Editor",
//     "description": "Ejemplo descripcion",
//     "pages": 100,
//     "averageRating": 4,
//     "usersRating": null,
//     "cover": "url Cover",
//     "identifier": "ISB:de ejemplo",
//     "authors": [ "5a491c43-463a-4435-9fa6-bd85112525b3" ],
//     "genres": [ "f91199a2-5650-438b-b4ec-ae5872aef461" ]
// }

router.post("/", async (req, res) => {
  try {
    validatePost(req.body);

    let {
      authorName,
      genreName,
      title,
      publishedDate,
      publisher,
      description,
      pages,
      averageRating,
      usersRating,
      cover,
      identifier,
    } = req.body;

    console.log("Req. body: ", authorName);

    let author = await Author.findOrCreate({
      where: { name: authorName },
      raw: true,
    });
    let genre = await Genre.findOrCreate({
      where: { name: genreName },
      raw: true,
    });

    let newBook = await Book.create({
      title,
      publishedDate,
      publisher,
      description,
      pages,
      averageRating: parseFloat(averageRating),
      cover,
      identifier,
    });
    if (!newBook) {
      throw new Error("no se pudo crear el libro");
    }

    newBook.setGenre(genre[0].id);
    newBook.setAuthor(author[0].id);

    res.status(200).json(await getBooksBytitle(title));
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.get("/", async (req, res) => {
  let { title } = req.query;
  let books = [];
  try {
    if (!title) {
      books = await getDbBooks();

      if (!books.length) {
        books = await createDbBooks();
      }

      res.status(200).json(books);
    } else {
      books = await getBooksBytitle(title);
      if (!books.length) {
        throw new Error("No existen libros con ese nombre");
      }
      res.status(200).json(books);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.get("/trending", async (req, res) => {
  try {
    let topTen = await getTrendingsBooks();
    if (!topTen.length) {
      throw new Error("Error al ordenar los libros");
    }
    res.status(200).json(topTen);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.get("/news", async (req, res) => {
  try {
    let newsTen = await getNewBooks();
    if (!newsTen.length) {
      throw new Error("Error al ordenar los libros");
    }
    res.status(200).json(newsTen);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    validateId(id);
    let book = await getBookById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    res.status(200).json(book);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.post("/:id/favorite", async (req, res) => {
  let { id } = req.params;
  let userId = req.body.id;
  try {
    validateId(id);
    let book = await getBookById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    await book.addFavorites(userId);
    res.status(200).json(book);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.post("/:id/read", async (req, res) => {
  let { id } = req.params;
  let userId = req.body.id;
  try {
    validateId(id);
    let book = await getBookById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    await book.addRead(userId);
    res.status(200).json(book);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.post("/:id/reading", async (req, res) => {
  let { id } = req.params;
  let userId = req.body.id;
  try {
    validateId(id);
    let book = await getBookById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    await book.addReading(userId);
    res.status(200).json(book);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.delete("/:id/favorite", async (req, res) => {
  let { id } = req.params;
  let userId = req.body.id;
  try {
    validateId(id);
    let book = await getBookById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    await book.removeFavorites(userId);
    res.status(200).json(book);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.delete("/:id/read", async (req, res) => {
  let { id } = req.params;
  let userId = req.body.id;
  try {
    validateId(id);
    let book = await getBookById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    await book.removeRead(userId);
    res.status(200).json(book);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.delete("/:id/reading", async (req, res) => {
  let { id } = req.params;
  let userId = req.body.id;
  try {
    validateId(id);
    let book = await getBookById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    await book.removeReading(userId);
    res.status(200).json(book);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.post("/:id/review", async (req, res) => {
  let bookId = req.params.id;
  let { comment, score, userId } = req.body;

  try {
    validateId(bookId);
    let book = await getBookById(bookId);
    let user = await getUserById(userId);
    let review = await Review.create({
      comment,
      score,
      create_date: new Date(),
    });

    await review.setUser(userId);
    await review.setBook(bookId);

    res.status(200).json(review);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

router.delete("/:id/review", async (req, res) => {
  let { id } = req.body;

  try {
    let review = await Review.findByPk(id);

    await review.destroy();

    res.status(200).json(review);
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
});

module.exports = router;
