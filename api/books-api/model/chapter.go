package model

import "time"

type Chapter struct {
	ID            string    `json:"id"`
	FictionID     string    `json:"fictionId"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	ChapterNumber int       `json:"chapterNumber"`
	Status        string    `json:"status"` // draft, published
	PublishedAt   time.Time `json:"publishedAt"`
	CreatedAt     time.Time `json:"createdAt"`
}
