package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/guhaag/writerslife-books-api/model"
	"golang.org/x/crypto/bcrypt"
)

// ── JWT ──────────────────────────────────────────────────────────────────────

var jwtSecret = []byte("writerslife-dev-secret")

type Claims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func makeToken(user *model.User) (string, error) {
	claims := Claims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.Username,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtSecret)
}

func parseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

// ── In-memory store ───────────────────────────────────────────────────────────

var mu sync.RWMutex

var users = map[string]*model.User{}        // id → user
var usersByName = map[string]*model.User{}  // username → user
var usersByEmail = map[string]*model.User{} // email → user

var fictions = map[string]*model.Fiction{}  // id → fiction
var chapters = map[string][]*model.Chapter{} // fictionId → chapters
var follows = map[string]map[string]bool{}  // userId → set of fictionIds

var nextUserID    = 1
var nextFictionID = 1
var nextChapterID = 1

func newUserID() string    { id := strconv.Itoa(nextUserID); nextUserID++; return "u" + id }
func newFictionID() string { id := strconv.Itoa(nextFictionID); nextFictionID++; return "f" + id }
func newChapterID() string { id := strconv.Itoa(nextChapterID); nextChapterID++; return "c" + id }

// ── Middleware ────────────────────────────────────────────────────────────────

func authRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		claims, err := parseToken(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func getUser(c *gin.Context) (*model.User, bool) {
	uid, _ := c.Get("userID")
	mu.RLock()
	u, ok := users[uid.(string)]
	mu.RUnlock()
	return u, ok
}

func isFollowing(userID, fictionID string) bool {
	if m, ok := follows[userID]; ok {
		return m[fictionID]
	}
	return false
}

// ── Auth handlers ─────────────────────────────────────────────────────────────

func registerHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
		Bio      string `json:"bio"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	if _, exists := usersByName[req.Username]; exists {
		c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
		return
	}
	if _, exists := usersByEmail[req.Email]; exists {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}

	u := &model.User{
		ID:           newUserID(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
		Bio:          req.Bio,
		CreatedAt:    time.Now(),
	}
	users[u.ID] = u
	usersByName[u.Username] = u
	usersByEmail[u.Email] = u

	token, _ := makeToken(u)
	c.JSON(http.StatusCreated, gin.H{"token": token, "username": u.Username})
}

func loginHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mu.RLock()
	u, ok := usersByName[req.Username]
	mu.RUnlock()

	if !ok || bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	token, _ := makeToken(u)
	c.JSON(http.StatusOK, gin.H{"token": token, "username": u.Username})
}

// ── Fiction handlers ──────────────────────────────────────────────────────────

func listFictionsHandler(c *gin.Context) {
	search := strings.ToLower(c.Query("search"))
	genre := strings.ToLower(c.Query("genre"))
	sort := c.Query("sort") // recent | popular

	mu.RLock()
	result := make([]*model.Fiction, 0, len(fictions))
	for _, f := range fictions {
		if search != "" && !strings.Contains(strings.ToLower(f.Title), search) &&
			!strings.Contains(strings.ToLower(f.Synopsis), search) {
			continue
		}
		if genre != "" {
			found := false
			for _, g := range f.Genres {
				if strings.ToLower(g) == genre {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		result = append(result, f)
	}
	mu.RUnlock()

	if sort == "popular" {
		for i := 0; i < len(result)-1; i++ {
			for j := i + 1; j < len(result); j++ {
				if result[j].ViewCount > result[i].ViewCount {
					result[i], result[j] = result[j], result[i]
				}
			}
		}
	} else {
		// default: recent
		for i := 0; i < len(result)-1; i++ {
			for j := i + 1; j < len(result); j++ {
				if result[j].UpdatedAt.After(result[i].UpdatedAt) {
					result[i], result[j] = result[j], result[i]
				}
			}
		}
	}

	c.JSON(http.StatusOK, result)
}

func getFictionHandler(c *gin.Context) {
	id := c.Param("id")
	mu.Lock()
	f, ok := fictions[id]
	if ok {
		f.ViewCount++
	}
	mu.Unlock()
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	c.JSON(http.StatusOK, f)
}

func createFictionHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	var req struct {
		Title    string   `json:"title" binding:"required"`
		Synopsis string   `json:"synopsis"`
		CoverURL string   `json:"coverUrl"`
		Genres   []string `json:"genres"`
		Tags     []string `json:"tags"`
		Status   string   `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Status == "" {
		req.Status = "ongoing"
	}

	mu.Lock()
	f := &model.Fiction{
		ID:         newFictionID(),
		AuthorID:   u.ID,
		AuthorName: u.Username,
		Title:      req.Title,
		Synopsis:   req.Synopsis,
		CoverURL:   req.CoverURL,
		Genres:     req.Genres,
		Tags:       req.Tags,
		Status:     req.Status,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	fictions[f.ID] = f
	chapters[f.ID] = []*model.Chapter{}
	mu.Unlock()

	c.JSON(http.StatusCreated, f)
}

func updateFictionHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	id := c.Param("id")

	mu.Lock()
	defer mu.Unlock()

	f, exists := fictions[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	if f.AuthorID != u.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your fiction"})
		return
	}

	var req struct {
		Title    string   `json:"title"`
		Synopsis string   `json:"synopsis"`
		CoverURL string   `json:"coverUrl"`
		Genres   []string `json:"genres"`
		Tags     []string `json:"tags"`
		Status   string   `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != "" {
		f.Title = req.Title
	}
	if req.Synopsis != "" {
		f.Synopsis = req.Synopsis
	}
	if req.CoverURL != "" {
		f.CoverURL = req.CoverURL
	}
	if req.Genres != nil {
		f.Genres = req.Genres
	}
	if req.Tags != nil {
		f.Tags = req.Tags
	}
	if req.Status != "" {
		f.Status = req.Status
	}
	f.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, f)
}

// ── Chapter handlers ──────────────────────────────────────────────────────────

func listChaptersHandler(c *gin.Context) {
	fictionID := c.Param("id")

	// Determine if the requester is the author (optional auth).
	var callerID string
	if header := c.GetHeader("Authorization"); strings.HasPrefix(header, "Bearer ") {
		if claims, err := parseToken(strings.TrimPrefix(header, "Bearer ")); err == nil {
			callerID = claims.UserID
		}
	}

	mu.RLock()
	f, ok := fictions[fictionID]
	if !ok {
		mu.RUnlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	isAuthor := callerID != "" && callerID == f.AuthorID
	all := chapters[fictionID]
	result := make([]*model.Chapter, 0)
	for _, ch := range all {
		if ch.Status == "published" || isAuthor {
			result = append(result, ch)
		}
	}
	mu.RUnlock()
	c.JSON(http.StatusOK, result)
}

func getChapterHandler(c *gin.Context) {
	fictionID := c.Param("id")
	num, err := strconv.Atoi(c.Param("num"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid chapter number"})
		return
	}

	// Allow the author to retrieve their own draft chapters.
	var callerID string
	if header := c.GetHeader("Authorization"); strings.HasPrefix(header, "Bearer ") {
		if claims, err := parseToken(strings.TrimPrefix(header, "Bearer ")); err == nil {
			callerID = claims.UserID
		}
	}

	mu.RLock()
	defer mu.RUnlock()
	f, ok := fictions[fictionID]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	isAuthor := callerID != "" && callerID == f.AuthorID
	for _, ch := range chapters[fictionID] {
		if ch.ChapterNumber == num && (ch.Status == "published" || isAuthor) {
			c.JSON(http.StatusOK, ch)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "chapter not found"})
}

func createChapterHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	fictionID := c.Param("id")

	mu.Lock()
	defer mu.Unlock()

	f, exists := fictions[fictionID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	if f.AuthorID != u.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your fiction"})
		return
	}

	var req struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content"`
		Status  string `json:"status"` // draft | published
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Status == "" {
		req.Status = "draft"
	}

	chNum := len(chapters[fictionID]) + 1
	ch := &model.Chapter{
		ID:            newChapterID(),
		FictionID:     fictionID,
		Title:         req.Title,
		Content:       req.Content,
		ChapterNumber: chNum,
		Status:        req.Status,
		CreatedAt:     time.Now(),
	}
	if req.Status == "published" {
		ch.PublishedAt = time.Now()
		f.ChapterCount++
		f.UpdatedAt = time.Now()
	}
	chapters[fictionID] = append(chapters[fictionID], ch)
	c.JSON(http.StatusCreated, ch)
}

func updateChapterHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	fictionID := c.Param("id")
	num, err := strconv.Atoi(c.Param("num"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid chapter number"})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	f, exists := fictions[fictionID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	if f.AuthorID != u.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your fiction"})
		return
	}

	var target *model.Chapter
	for _, ch := range chapters[fictionID] {
		if ch.ChapterNumber == num {
			target = ch
			break
		}
	}
	if target == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "chapter not found"})
		return
	}

	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		Status  string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Title != "" {
		target.Title = req.Title
	}
	if req.Content != "" {
		target.Content = req.Content
	}
	if req.Status != "" && req.Status != target.Status {
		if req.Status == "published" && target.Status == "draft" {
			target.PublishedAt = time.Now()
			f.ChapterCount++
			f.UpdatedAt = time.Now()
		}
		target.Status = req.Status
	}
	c.JSON(http.StatusOK, target)
}

// ── Follow handlers ───────────────────────────────────────────────────────────

func followHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	fictionID := c.Param("id")

	mu.Lock()
	defer mu.Unlock()

	f, exists := fictions[fictionID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	if follows[u.ID] == nil {
		follows[u.ID] = map[string]bool{}
	}
	if !follows[u.ID][fictionID] {
		follows[u.ID][fictionID] = true
		f.FollowerCount++
	}
	c.JSON(http.StatusOK, gin.H{"following": true})
}

func unfollowHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	fictionID := c.Param("id")

	mu.Lock()
	defer mu.Unlock()

	f, exists := fictions[fictionID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "fiction not found"})
		return
	}
	if follows[u.ID] != nil && follows[u.ID][fictionID] {
		delete(follows[u.ID], fictionID)
		if f.FollowerCount > 0 {
			f.FollowerCount--
		}
	}
	c.JSON(http.StatusOK, gin.H{"following": false})
}

// ── User handlers ─────────────────────────────────────────────────────────────

func publicProfileHandler(c *gin.Context) {
	username := c.Param("username")

	mu.RLock()
	u, ok := usersByName[username]
	mu.RUnlock()

	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	mu.RLock()
	myFictions := make([]*model.Fiction, 0)
	for _, f := range fictions {
		if f.AuthorID == u.ID {
			myFictions = append(myFictions, f)
		}
	}
	mu.RUnlock()

	c.JSON(http.StatusOK, gin.H{
		"user":    u,
		"fictions": myFictions,
	})
}

func meHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, u)
}

func myFictionsHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	mu.RLock()
	result := make([]*model.Fiction, 0)
	for _, f := range fictions {
		if f.AuthorID == u.ID {
			result = append(result, f)
		}
	}
	mu.RUnlock()

	c.JSON(http.StatusOK, result)
}

func myFollowsHandler(c *gin.Context) {
	u, ok := getUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	mu.RLock()
	result := make([]*model.Fiction, 0)
	if followed, ok := follows[u.ID]; ok {
		for fid := range followed {
			if f, ok := fictions[fid]; ok {
				result = append(result, f)
			}
		}
	}
	mu.RUnlock()

	c.JSON(http.StatusOK, result)
}

func followStatusHandler(c *gin.Context) {
	fictionID := c.Param("id")
	header := c.GetHeader("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		c.JSON(http.StatusOK, gin.H{"following": false})
		return
	}
	claims, err := parseToken(strings.TrimPrefix(header, "Bearer "))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"following": false})
		return
	}
	mu.RLock()
	following := isFollowing(claims.UserID, fictionID)
	mu.RUnlock()
	c.JSON(http.StatusOK, gin.H{"following": following})
}

// ── Seed data ─────────────────────────────────────────────────────────────────

func seed() {
	hash1, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	hash2, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)

	author1 := &model.User{
		ID:           newUserID(),
		Username:     "elara_writes",
		Email:        "elara@example.com",
		PasswordHash: string(hash1),
		Bio:          "Fantasy and sci-fi author. Lover of dragons and space.",
		AvatarURL:    "",
		CreatedAt:    time.Now().Add(-90 * 24 * time.Hour),
	}
	author2 := &model.User{
		ID:           newUserID(),
		Username:     "nightquill",
		Email:        "night@example.com",
		PasswordHash: string(hash2),
		Bio:          "Horror and thriller writer. Writes best at 3am.",
		AvatarURL:    "",
		CreatedAt:    time.Now().Add(-60 * 24 * time.Hour),
	}

	users[author1.ID] = author1
	usersByName[author1.Username] = author1
	usersByEmail[author1.Email] = author1
	users[author2.ID] = author2
	usersByName[author2.Username] = author2
	usersByEmail[author2.Email] = author2

	f1 := &model.Fiction{
		ID:            newFictionID(),
		AuthorID:      author1.ID,
		AuthorName:    author1.Username,
		Title:         "The Last Arcanist",
		Synopsis:      "In a world where magic has been outlawed for centuries, Mira discovers she is the last person born with arcane power. Hunted by the Inquisition and sought by rebels, she must choose between hiding in safety or embracing her destiny.",
		Genres:        []string{"Fantasy", "Adventure"},
		Tags:          []string{"magic", "chosen one", "political intrigue"},
		Status:        "ongoing",
		CreatedAt:     time.Now().Add(-80 * 24 * time.Hour),
		UpdatedAt:     time.Now().Add(-2 * 24 * time.Hour),
		FollowerCount: 142,
		ViewCount:     3871,
		ChapterCount:  3,
	}
	f2 := &model.Fiction{
		ID:            newFictionID(),
		AuthorID:      author1.ID,
		AuthorName:    author1.Username,
		Title:         "Starfall Station",
		Synopsis:      "A derelict space station on the edge of a dying star holds the last archive of human knowledge. Three unlikely strangers must work together to retrieve it before the star goes supernova.",
		Genres:        []string{"Sci-Fi", "Adventure"},
		Tags:          []string{"space", "found family", "survival"},
		Status:        "ongoing",
		CreatedAt:     time.Now().Add(-40 * 24 * time.Hour),
		UpdatedAt:     time.Now().Add(-5 * 24 * time.Hour),
		FollowerCount: 89,
		ViewCount:     2104,
		ChapterCount:  2,
	}
	f3 := &model.Fiction{
		ID:            newFictionID(),
		AuthorID:      author2.ID,
		AuthorName:    author2.Username,
		Title:         "The Hollow Hours",
		Synopsis:      "Every night at 3am, the town of Marrow Falls becomes a different place. Detective Elena Cross is the only one who remembers what happens in the hollow hours — and she's starting to suspect she may be the reason it's happening.",
		Genres:        []string{"Horror", "Mystery"},
		Tags:          []string{"psychological", "small town", "supernatural"},
		Status:        "ongoing",
		CreatedAt:     time.Now().Add(-55 * 24 * time.Hour),
		UpdatedAt:     time.Now().Add(-1 * 24 * time.Hour),
		FollowerCount: 201,
		ViewCount:     5430,
		ChapterCount:  2,
	}

	fictions[f1.ID] = f1
	fictions[f2.ID] = f2
	fictions[f3.ID] = f3
	chapters[f1.ID] = []*model.Chapter{}
	chapters[f2.ID] = []*model.Chapter{}
	chapters[f3.ID] = []*model.Chapter{}

	// Chapters for f1
	addSeedChapter(f1.ID, "Prologue: The Burning Library", "The night the Grand Library burned, Mira was the only witness. She had snuck in after hours to return a stolen book — a book that, as it turned out, she should never have been able to read.\n\nThe fire started in the restricted section. She saw no torch, no lantern. Only a soft blue glow that rapidly became an inferno. The books screamed — that is the only way she could describe it — as their pages curled and blackened.\n\nShe ran. But not before pocketing the small silver compass that had been lying open on the reading table, spinning wildly though there was no magnetic north for a hundred miles.", time.Now().Add(-79 * 24 * time.Hour))
	addSeedChapter(f1.ID, "Chapter 1: The Inquisitor's Visit", "Three months after the fire, the Inquisitor arrived in Millhaven.\n\nMira watched from the bakery window as the black carriage rolled down the cobblestone street. No insignia. No escort. That made it worse, somehow — the ones who needed no announcement were the ones with nothing to prove.\n\n\"Back to work,\" said Aunt Renee, not looking up from the bread she was shaping. \"And stop biting your nails.\"\n\nMira pulled her hand from her mouth. She had been doing it again — that nervous habit that had gotten worse since the library. Since the night she had felt something inside her chest unlock like a door she hadn't known was there.", time.Now().Add(-70 * 24 * time.Hour))
	addSeedChapter(f1.ID, "Chapter 2: What the Compass Shows", "The compass did not point north. It pointed at people.\n\nMira had figured this out on the walk home from the library, the night of the fire. It spun uselessly when she held it in an empty room. But the moment someone walked in, the needle snapped toward them like an accusation.\n\nShe thought it pointed at heat, at first. Then at heartbeats. It took her two weeks to understand the truth.\n\nIt pointed at magic.", time.Now().Add(-65 * 24 * time.Hour))

	// Chapters for f2
	addSeedChapter(f2.ID, "Arrival", "The shuttle docked with a sound like a body hitting the floor.\n\nKael had worked salvage for eleven years and he had never heard a station make that sound before. Stations groaned. They hissed. They occasionally shrieked when something critical failed. They did not thud.\n\n\"Structural settling,\" said the station's automated voice, as if it had heard him think. \"Please proceed to the welcome bay.\"\n\nThe welcome bay, it turned out, was a room containing three things: a broken vending machine, two other salvagers who looked as suspicious of him as he was of them, and a single laminated card taped to the wall that read: DO NOT GO BELOW DECK 7.", time.Now().Add(-38 * 24 * time.Hour))
	addSeedChapter(f2.ID, "Deck 7", "They went to deck 7 within the hour.\n\nIt wasn't stubbornness, exactly. Or rather, it was stubbornness, but the rational kind. Kael had learned long ago that signs saying DO NOT were essentially maps to wherever the money was. The other two — a woman named Sable who claimed to be a data archaeologist, and a kid who refused to give a name and was therefore called 'the kid' — had reached the same conclusion independently.\n\n\"We're not a team,\" Sable said, as they all stepped into the elevator together.\n\n\"Obviously,\" said Kael.\n\n\"Obviously,\" said the kid.", time.Now().Add(-30 * 24 * time.Hour))

	// Chapters for f3
	addSeedChapter(f3.ID, "3:00 AM, Tuesday", "The call came in at 2:58, which meant Elena had two minutes to finish her coffee and get to the scene before it became something else entirely.\n\nMarrow Falls was a small enough town that 'the scene' was never far. She was there in four minutes. She was late.\n\nThe Hendersons' living room had rearranged itself. That was the only way to put it. The furniture was in the same positions — couch against the east wall, television opposite, armchair by the window — but the distances between them had changed. The room was larger. Or the furniture was smaller. Or something in between that Elena didn't have the geometry for.\n\nMr. Henderson stood in the center of it, looking at his hands.\n\n\"It happened again,\" he said.", time.Now().Add(-53 * 24 * time.Hour))
	addSeedChapter(f3.ID, "The Only One Who Remembers", "By morning, it was gone.\n\nThe room was back to its normal dimensions. Mr. Henderson remembered nothing. His wife, asleep upstairs the whole time, had a vague feeling she'd had a strange dream but couldn't say what it was.\n\nElena sat in her cruiser outside their house and wrote in her notebook: *Third incident this month. Third time I'm the only one who remembers.*\n\nShe had started keeping the notebook six months ago, after the first hollow hour. She had initially written it off as stress, sleep deprivation, the particular way that small-town detective work could make a person feel untethered from consensus reality.\n\nThen she started noticing that the incidents always centered on her location.", time.Now().Add(-48 * 24 * time.Hour))
}

func addSeedChapter(fictionID, title, content string, publishedAt time.Time) {
	chNum := len(chapters[fictionID]) + 1
	ch := &model.Chapter{
		ID:            newChapterID(),
		FictionID:     fictionID,
		Title:         title,
		Content:       content,
		ChapterNumber: chNum,
		Status:        "published",
		PublishedAt:   publishedAt,
		CreatedAt:     publishedAt,
	}
	chapters[fictionID] = append(chapters[fictionID], ch)
}

// ── Main ──────────────────────────────────────────────────────────────────────

func main() {
	seed()

	router := gin.Default()
	router.Use(corsMiddleware())

	api := router.Group("/api")

	// Auth
	api.POST("/auth/register", registerHandler)
	api.POST("/auth/login", loginHandler)

	// Fictions (public reads)
	api.GET("/fictions", listFictionsHandler)
	api.GET("/fictions/:id", getFictionHandler)
	api.GET("/fictions/:id/chapters", listChaptersHandler)
	api.GET("/fictions/:id/chapters/:num", getChapterHandler)
	api.GET("/fictions/:id/follow/status", followStatusHandler)

	// Fictions (auth required)
	auth := api.Group("/", authRequired())
	auth.POST("/fictions", createFictionHandler)
	auth.PUT("/fictions/:id", updateFictionHandler)
	auth.POST("/fictions/:id/chapters", createChapterHandler)
	auth.PUT("/fictions/:id/chapters/:num", updateChapterHandler)
	auth.POST("/fictions/:id/follow", followHandler)
	auth.DELETE("/fictions/:id/follow", unfollowHandler)

	// User
	api.GET("/users/:username", publicProfileHandler)
	auth.GET("/user/me", meHandler)
	auth.GET("/user/fictions", myFictionsHandler)
	auth.GET("/user/follows", myFollowsHandler)

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}
