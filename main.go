package main

// ======================================
// Imports
import (
	"context"
	"encoding/base64"
	"encoding/json"
	"github.com/patrickmn/go-cache"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

// ======================================
// ======================================
// Singleton variables and struct
var (
	lock      = &sync.Mutex{}
	gmail_srv *singleton
)

type singleton struct {
	srv *gmail.Service
}

// ContactRequest struct for the form fields
type contactRequest struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Message   string `json:"msg"`
}

// ======================================
// ======================================
// Project handler vars and structs
var (
	github_api_url = "https://api.github.com/users/Deezzir/repos?sort=pushed&per_page=15"
	project_cache  = cache.New(5*time.Minute, 10*time.Minute)
)

// Repository struct for github api repos
type repository struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	RepoURL     string   `json:"html_url"`
	Language    string   `json:"language"`
	Topics      []string `json:"topics"`
}

// ======================================
// ======================================
// Gmail API, OAuth2 helper functions
// ======================================

// Function to create the config for Gmail API from env
func getGmailConfig() *oauth2.Config {
	cliendID := os.Getenv("GMAIL_CLIENT_ID")
	clientSecret := os.Getenv("GMAIL_CLIENT_SECRET")

	if cliendID == "" || clientSecret == "" {
		log.Fatalln("[ERROR]: GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET not set")
	}

	config := &oauth2.Config{
		ClientID:     cliendID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		RedirectURL:  "http://localhost",
	}

	return config
}

// Function to create the token for Gmail Api from env
func getGmailToken() *oauth2.Token {
	accessToken := os.Getenv("GMAIL_ACCESS_TOKEN")
	refreshToken := os.Getenv("GMAIL_REFRESH_TOKEN")

	if accessToken == "" || refreshToken == "" {
		log.Fatalln("[ERROR]: GMAIL_ACCESS_TOKEN or GMAIL_REFRESH_TOKEN not set")
	}

	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		Expiry:       time.Now().Add(time.Hour * 24),
	}

	return token
}

// Retrieve a token, saves the token, then returns the generated client
func getGmailClient(config *oauth2.Config) *http.Client {
	return config.Client(context.Background(), getGmailToken())
}

// Function to get the Service for Gmail API in Singleton pattern
func getGmailService() *singleton {
	if gmail_srv == nil {
		lock.Lock()
		defer lock.Unlock()
		if gmail_srv == nil {
			ctx := context.Background()
			client := getGmailClient(getGmailConfig())

			srv, err := gmail.NewService(ctx, option.WithHTTPClient(client))
			if err != nil {
				log.Fatalf("[ERROR]: Unable to retrieve Gmail client: %v\n", err)
			}

			gmail_srv = &singleton{srv: srv}
		}
	}
	return gmail_srv
}

// ======================================
// ======================================
// Function to send email using Gmail API
func sendEmail(r contactRequest, srv *gmail.Service) bool {
	// Create the message
	msg := "From: " + r.Email +
		"\nName: " + r.FirstName + " " + r.LastName +
		"\n\n\n" + r.Message

	email_text := "From: " + r.Email + "\r\n" +
		"To: " + "deezzir@gmail.com" + "\r\n" +
		"Subject: Portfolio Contact\r\n\r\n" +
		msg

	email := &gmail.Message{
		Raw: base64.URLEncoding.EncodeToString([]byte(email_text)),
	}

	_, err := srv.Users.Messages.Send("me", email).Do()
	if err != nil {
		log.Println("[ERROR]: Failed to send email\n", err)
	} else {
		log.Println("[INFO]: Email sent successfully")
	}
	return err == nil
}

// ======================================
// ======================================
// Handler for '/contact' route
// Sends an email using the Gmail API, error if failed
func contactHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/contact" {
		http.Error(w, "404 not found.", http.StatusNotFound)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method is not supported.", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	var c contactRequest

	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	log.Printf("[INFO]: Sending email with: %+v\n", c)
	if ok := sendEmail(c, getGmailService().srv); ok {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusInternalServerError)
	}
}

// ======================================
// ======================================
// Handler for '/projects' route
// Sends a list of  GitHub repos to the client, error if failed
func projectHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/project" {
		http.Error(w, "404 not found.", http.StatusNotFound)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method is not supported.", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if projects, ok := fetchProjects(); ok {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(projects)
		return
	} else {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// ======================================
// ======================================
// Function to fetch projects from Github API and cache them
// Returns a list of repositories and a boolean indicating success
func fetchProjects() ([]repository, bool) {
	var projects []repository

	if ps, ok := project_cache.Get("projects"); ok {
		log.Println("[INFO]: Getting cached projects")
		projects = ps.([]repository)
	} else {
		resp, err := http.Get(github_api_url)

		if err != nil {
			log.Println("[ERROR]: Failed to get projects from GitHubAPI", err)
			return nil, false
		} else {
			defer resp.Body.Close()

			if err := json.NewDecoder(resp.Body).Decode(&projects); err != nil {
				log.Println("[ERROR]: Failed to decode projects from GitHubAPI", err)
				return nil, false
			} else {
				log.Println("[INFO]: Projects from GitHubAPI decoded successfully")
				log.Println("[INFO]: Caching projects from GitHubAPI")
				project_cache.Set("projects", projects, cache.DefaultExpiration)
			}
		}
	}
	return projects, true
}

// ======================================
// =============== MAIN =================
var server_port = "0.0.0.0:8080"

func main() {
	file_server := http.FileServer(http.Dir("./static"))

	http.Handle("/", file_server)
	http.HandleFunc("/contact", contactHandler)
	http.HandleFunc("/project", projectHandler)

	// Check if environment variable is set and create Gmail Service
	//getGmailService()

	log.Println("[INFO]: Starting server at", server_port)
	if err := http.ListenAndServe(server_port, nil); err != nil {
		log.Fatalln(err)
	}
}
