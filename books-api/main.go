package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/guhaag/writerslife-books-api/model"
)

// books slice to seed record book data.
var books = []model.Book{
	{ID: "1", Title: "Blue Train", Author: "John Coltrane"},
	{ID: "2", Title: "Jeru", Author: "Gerry Mulligan"},
	{ID: "3", Title: "Sarah Vaughan and Clifford Brown", Author: "Sarah Vaughan"},
}

func main() {
	router := gin.Default()
	router.GET("/books", getBooks)
	router.GET("/book/:id", getBookByID)
	router.POST("/book", postBook)

	err := router.Run("localhost:8080")
	if err != nil {
		return
	}
}

// getBooks responds with the list of all books as JSON.
func getBooks(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, books)
}

// postBook adds a book from JSON received in the request body.
func postBook(c *gin.Context) {
	var newBook model.Book

	// Call BindJSON to bind the received JSON to
	// newBook.
	if err := c.BindJSON(&newBook); err != nil {
		return
	}

	// Add the new book to the slice.
	books = append(books, newBook)
	c.IndentedJSON(http.StatusCreated, newBook)
}

// getBookByID locates the book whose ID value matches the id
// parameter sent by the client, then returns that book as a response.
func getBookByID(c *gin.Context) {
	id := c.Param("id")

	// Loop through the list of books, looking for
	// a book whose ID value matches the parameter.
	for _, a := range books {
		if a.ID == id {
			c.IndentedJSON(http.StatusOK, a)
			return
		}
	}
	c.IndentedJSON(http.StatusNotFound, gin.H{"message": "book not found"})
}
